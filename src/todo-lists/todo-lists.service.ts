import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TodoListRepository } from 'src/common/repositories/todo-list.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { TodoListEntity } from 'src/core/database/entities/todo-list.entity';
import { TodoItemEntity } from 'src/core/database/entities/todo-item.entity';
import { CreateTodoListDto, UpdateTodoListDto } from './dto/todo-list.dto';
import { TodoListQueryDto } from './dto/todo-list-query.dto';
import { TodoDueFilter } from 'src/common/types/todo-due-filter.enum';
import { TodoSortField } from 'src/common/types/todo-sort-field.enum';
import { TodoSortOrder } from 'src/common/types/todo-sort-order.enum';
import { TodoPriority } from 'src/common/types/todo-priority.enum';
import { TodoStatus } from 'src/common/types/todo-status.enum';

@Injectable()
export class TodoListsService {
  constructor(
    private readonly todoListRepository: TodoListRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  private async resolveOrgId(user: UserEntity, orgId?: string | null): Promise<string> {
    if (orgId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, orgId);
      if (!isMember) throw new ForbiddenException('You are not a member of this organization');
      return orgId;
    }
    const defaultOrg = await this.organizationsService.getOrEnsureDefaultOrg(user);
    return defaultOrg.Id;
  }

  async create(dto: CreateTodoListDto, user: UserEntity, orgId?: string | null): Promise<TodoListEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId ?? dto.OrganizationId);
    const list = this.todoListRepository.create({
      Name: dto.Name,
      OrganizationId: resolvedOrgId,
      BoardId: dto.BoardId ?? null,
      Position: dto.Position ?? 0,
      CreatedBy: user,
    });
    return this.todoListRepository.save(list);
  }

  async findAll(
    user: UserEntity,
    orgId?: string | null,
    query?: TodoListQueryDto,
  ): Promise<TodoListEntity[]> {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    let lists = await this.todoListRepository.findAllByOrg(resolvedOrgId);

    if (query && Object.keys(query).length > 0) {
      lists = this.applyFiltersAndSort(lists, query);
    }

    return lists;
  }

  async findAllWithFilters(
    user: UserEntity,
    orgId?: string | null,
    query?: TodoListQueryDto,
  ) {
    const lists = await this.findAll(user, orgId, query);
    const hasActiveFilters = !!(
      query?.status ||
      query?.due ||
      query?.priority ||
      query?.listId ||
      query?.search?.trim()
    );
    const filtered = hasActiveFilters
      ? lists.filter((l) => (l.TodoItems?.length ?? 0) > 0)
      : lists;
    return createPaginatedResponse(filtered, filtered.length, 1, filtered.length);
  }

  async findAllPaginated(
    user: UserEntity,
    orgId?: string | null,
    query?: TodoListQueryDto,
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    const [allLists, total] = await this.todoListRepository.findAllByOrgPaginated(
      resolvedOrgId,
      skip,
      take,
    );
    let lists = allLists;
    if (query && Object.keys(query).length > 0) {
      lists = this.applyFiltersAndSort(lists, query);
    }
    return createPaginatedResponse(lists, total, page, take);
  }

  private applyFiltersAndSort(
    lists: TodoListEntity[],
    query: TodoListQueryDto,
  ): TodoListEntity[] {
    const { status, due, priority, listId, search, sort, order } = query;

    let result = lists;

    if (listId) {
      result = result.filter((l) => l.Id === listId);
    }

    result = result.map((list) => {
      let items = [...(list.TodoItems || [])];

      if (status) {
        items = items.filter((i) => (i.Status || '').toLowerCase() === status.toLowerCase());
      }
      if (due) {
        items = items.filter((i) => this.matchesDueFilter(i.DueDate, due));
      }
      if (priority) {
        items = items.filter((i) => (i.Priority || '').toLowerCase() === priority.toLowerCase());
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(
          (i) =>
            (i.Title || '').toLowerCase().includes(q) ||
            (i.Description || '').toLowerCase().includes(q),
        );
      }

      items = this.sortItems(items, sort || TodoSortField.CREATED_AT, order || TodoSortOrder.ASC);

      return { ...list, TodoItems: items };
    });

    if (listId && result.length === 0) {
      return result;
    }

    return result;
  }

  private matchesDueFilter(dueDate: Date | null | undefined, filter: TodoDueFilter): boolean {
    if (!dueDate) return filter === TodoDueFilter.NONE;
    const d = new Date(dueDate);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    switch (filter) {
      case TodoDueFilter.OVERDUE:
        return d < todayStart;
      case TodoDueFilter.TODAY:
        return d >= todayStart && d < todayEnd;
      case TodoDueFilter.WEEK:
        return d >= todayStart && d < weekEnd;
      case TodoDueFilter.NONE:
        return false;
      default:
        return true;
    }
  }

  private sortItems(
    items: TodoItemEntity[],
    sort: TodoSortField,
    order: TodoSortOrder,
  ): TodoItemEntity[] {
    const mult = order === TodoSortOrder.ASC ? 1 : -1;
    const priorityOrder: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case TodoSortField.DUE_DATE:
          const da = a.DueDate ? new Date(a.DueDate).getTime() : Infinity;
          const db = b.DueDate ? new Date(b.DueDate).getTime() : Infinity;
          cmp = da - db;
          break;
        case TodoSortField.PRIORITY:
          cmp =
            (priorityOrder[(a.Priority || '').toLowerCase()] || 0) -
            (priorityOrder[(b.Priority || '').toLowerCase()] || 0);
          break;
        case TodoSortField.CREATED_AT:
          cmp =
            new Date(a.CreatedAt || 0).getTime() - new Date(b.CreatedAt || 0).getTime();
          break;
        case TodoSortField.TITLE:
          cmp = (a.Title || '').localeCompare(b.Title || '');
          break;
        default:
          cmp = (a.Position || 0) - (b.Position || 0);
      }
      return cmp * mult;
    });
  }

  async findOne(id: string, user: UserEntity): Promise<TodoListEntity> {
    const list = await this.todoListRepository.findOneById(id);
    if (!list) throw new NotFoundException('Todo list not found');
    if (list.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, list.OrganizationId);
      if (!isMember) throw new ForbiddenException('You do not have access to this todo list');
    } else if (list.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('You do not have access to this todo list');
    }
    return list;
  }

  async update(id: string, dto: UpdateTodoListDto, user: UserEntity): Promise<TodoListEntity> {
    const list = await this.findOne(id, user);
    Object.assign(list, dto);
    return this.todoListRepository.save(list);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const list = await this.findOne(id, user);
    await this.todoListRepository.remove(list);
  }
}
