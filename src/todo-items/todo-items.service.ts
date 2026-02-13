import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TodoItemRepository } from 'src/common/repositories/todo-item.repository';
import { TodoListRepository } from 'src/common/repositories/todo-list.repository';
import { TodoRecurrenceRepository } from 'src/common/repositories/todo-recurrence.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { BidRepository } from 'src/common/repositories/bid.repository';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { TodoItemEntity } from 'src/core/database/entities/todo-item.entity';
import { TodoListEntity } from 'src/core/database/entities/todo-list.entity';
import { TodoRecurrenceEntity } from 'src/core/database/entities/todo-recurrence.entity';
import { CreateTodoItemDto, UpdateTodoItemDto, RecurrenceDto } from './dto/todo-item.dto';
import { TodoPriority } from 'src/common/types/todo-priority.enum';
import { TodoStatus } from 'src/common/types/todo-status.enum';
import { RecurrenceEndType } from 'src/common/types/recurrence-end-type.enum';
import { OrgRole } from 'src/common/types/org-role.enum';

@Injectable()
export class TodoItemsService {
  constructor(
    private readonly todoItemRepository: TodoItemRepository,
    private readonly todoListRepository: TodoListRepository,
    private readonly todoRecurrenceRepository: TodoRecurrenceRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly bidRepository: BidRepository,
  ) {}

  private async ensureAccessToList(listId: string, userId: string): Promise<TodoListEntity> {
    const list = await this.todoListRepository.findOneById(listId);
    if (!list) throw new NotFoundException('Todo list not found');
    if (list.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(userId, list.OrganizationId);
      if (!isMember) throw new ForbiddenException('You do not have access to this todo list');
    } else if (list.CreatedBy?.Id !== userId) {
      throw new ForbiddenException('You do not have access to this todo list');
    }
    return list;
  }

  private async ensureAccessToBid(bidId: string, userId: string): Promise<void> {
    const bid = await this.bidRepository.findOneById(bidId);
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(userId, bid.OrganizationId);
      if (!isMember) throw new ForbiddenException('You do not have access to this bid');
      const member = await this.orgMemberRepository.findByUserAndOrg(userId, bid.OrganizationId);
      if (member && [OrgRole.MEMBER, OrgRole.GUEST].includes(member.Role as OrgRole)) {
        if (bid.OwnerId !== userId) {
          throw new ForbiddenException('You do not have access to this bid');
        }
      }
    } else if (bid.OwnerId !== userId) {
      throw new ForbiddenException('You do not have access to this bid');
    }
  }

  async create(
    todoListId: string,
    dto: CreateTodoItemDto,
    user: UserEntity,
  ): Promise<TodoItemEntity> {
    await this.ensureAccessToList(todoListId, user.Id);
    if (dto.BidId) {
      if (!dto.DueDate) {
        throw new BadRequestException('Due date is required for bid-linked todos');
      }
      await this.ensureAccessToBid(dto.BidId, user.Id);
    }
    const item = this.todoItemRepository.create({
      TodoListId: todoListId,
      Title: dto.Title,
      Description: dto.Description ?? null,
      DueDate: dto.DueDate ? new Date(dto.DueDate) : null,
      Priority: dto.Priority ?? TodoPriority.MEDIUM,
      Status: dto.Status ?? TodoStatus.TODO,
      Position: dto.Position ?? 0,
      BidId: dto.BidId ?? null,
      CreatedBy: user,
    });
    return this.todoItemRepository.save(item);
  }

  async findAllByTodoListId(todoListId: string, user: UserEntity): Promise<TodoItemEntity[]> {
    await this.ensureAccessToList(todoListId, user.Id);
    return this.todoItemRepository.findAllByTodoListId(todoListId);
  }

  async findAllByTodoListIdPaginated(
    todoListId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.ensureAccessToList(todoListId, user.Id);
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.todoItemRepository.findAllByTodoListIdPaginated(
      todoListId,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async findOne(id: string, user: UserEntity): Promise<TodoItemEntity> {
    const item = await this.todoItemRepository.findOneById(id);
    if (!item) throw new NotFoundException('Todo item not found');
    await this.ensureAccessToList(item.TodoListId, user.Id);
    return item;
  }

  async update(id: string, dto: UpdateTodoItemDto, user: UserEntity): Promise<TodoItemEntity> {
    const item = await this.findOne(id, user);
    const { DueDate, TodoListId, Recurrence, BidId, ...rest } = dto;
    Object.assign(item, rest);
    if (DueDate !== undefined) item.DueDate = DueDate ? new Date(DueDate) : null;
    if (TodoListId !== undefined) {
      await this.ensureAccessToList(TodoListId, user.Id);
      item.TodoListId = TodoListId;
    }
    if (BidId !== undefined) {
      if (BidId) {
        if (!DueDate && !item.DueDate) {
          throw new BadRequestException('Due date is required for bid-linked todos');
        }
        await this.ensureAccessToBid(BidId, user.Id);
        item.BidId = BidId;
      } else {
        item.BidId = null;
      }
    }
    await this.todoItemRepository.save(item);
    if (Recurrence !== undefined) {
      if (Recurrence === null) {
        const existing = await this.todoRecurrenceRepository.findByTodoItemId(id);
        if (existing) await this.todoRecurrenceRepository.remove(existing);
      } else {
        await this.upsertRecurrence(id, Recurrence, user);
      }
    }
    return this.todoItemRepository.findOneById(id) ?? item;
  }

  private async upsertRecurrence(
    todoItemId: string,
    dto: RecurrenceDto,
    user: UserEntity,
  ): Promise<void> {
    const existing = await this.todoRecurrenceRepository.findByTodoItemId(todoItemId);
    const rec: Partial<TodoRecurrenceEntity> = {
      TodoItemId: todoItemId,
      RecurrenceType: dto.RecurrenceType,
      Interval: dto.Interval ?? 1,
      DaysOfWeek: dto.DaysOfWeek ?? null,
      DayOfMonth: dto.DayOfMonth ?? null,
      Month: dto.Month ?? null,
      EndType: dto.EndType ?? RecurrenceEndType.NEVER,
      EndAfterCount: dto.EndAfterCount ?? null,
      EndDate: dto.EndDate ? new Date(dto.EndDate) : null,
      CronExpression: dto.CronExpression ?? null,
      CreatedBy: user,
    };
    if (existing) {
      Object.assign(existing, rec);
      await this.todoRecurrenceRepository.save(existing);
    } else {
      const entity = this.todoRecurrenceRepository.create(rec);
      await this.todoRecurrenceRepository.save(entity);
    }
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const item = await this.findOne(id, user);
    await this.todoItemRepository.remove(item);
  }
}
