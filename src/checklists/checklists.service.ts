import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ChecklistItemRepository } from 'src/common/repositories/checklist-item.repository';
import { ChecklistRepository } from 'src/common/repositories/checklist.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { ChecklistEntity } from 'src/core/database/entities/checklist.entity';
import { ChecklistItemEntity } from 'src/core/database/entities/checklist-item.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import {
  CreateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistDto,
  UpdateChecklistItemDto,
} from './dto/checklist.dto';

@Injectable()
export class ChecklistsService {
  constructor(
    private readonly checklistRepository: ChecklistRepository,
    private readonly checklistItemRepository: ChecklistItemRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  private async ensureCardAccess(cardId: string, userId: string): Promise<void> {
    const card = await this.cardRepository.findOneById(cardId, [
      'List',
      'List.Board',
      'List.Board.CreatedBy',
    ]);
    if (!card) throw new NotFoundException('Card not found');
    const board = card.List?.Board;
    if (board?.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(userId, board.OrganizationId);
      if (!isMember) throw new ForbiddenException('Access denied');
    } else if (board?.CreatedBy?.Id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async createChecklist(
    cardId: string,
    dto: CreateChecklistDto,
    user: UserEntity,
  ): Promise<ChecklistEntity> {
    await this.ensureCardAccess(cardId, user.Id);
    const checklist = this.checklistRepository.create({
      CardId: cardId,
      Title: dto.Title,
      Position: dto.Position ?? 0,
      CreatedBy: user,
    });
    return this.checklistRepository.save(checklist);
  }

  async findByCardId(cardId: string, user: UserEntity): Promise<ChecklistEntity[]> {
    await this.ensureCardAccess(cardId, user.Id);
    return this.checklistRepository.findByCardId(cardId);
  }

  async updateChecklist(
    id: string,
    dto: UpdateChecklistDto,
    user: UserEntity,
  ): Promise<ChecklistEntity> {
    const checklist = await this.checklistRepository.findOneById(id);
    if (!checklist) throw new NotFoundException('Checklist not found');
    await this.ensureCardAccess(checklist.CardId, user.Id);
    Object.assign(checklist, dto);
    return this.checklistRepository.save(checklist);
  }

  async removeChecklist(id: string, user: UserEntity): Promise<void> {
    const checklist = await this.checklistRepository.findOneById(id);
    if (!checklist) throw new NotFoundException('Checklist not found');
    await this.ensureCardAccess(checklist.CardId, user.Id);
    await this.checklistRepository.remove(checklist);
  }

  async createItem(
    checklistId: string,
    dto: CreateChecklistItemDto,
    user: UserEntity,
  ): Promise<ChecklistItemEntity> {
    const checklist = await this.checklistRepository.findOneById(checklistId);
    if (!checklist) throw new NotFoundException('Checklist not found');
    await this.ensureCardAccess(checklist.CardId, user.Id);
    const item = this.checklistItemRepository.create({
      ChecklistId: checklistId,
      Title: dto.Title,
      IsCompleted: dto.IsCompleted ?? false,
      Position: dto.Position ?? 0,
      CreatedBy: user,
    });
    return this.checklistItemRepository.save(item);
  }

  async updateItem(
    id: string,
    dto: UpdateChecklistItemDto,
    user: UserEntity,
  ): Promise<ChecklistItemEntity> {
    const item = await this.checklistItemRepository.findOneById(id);
    if (!item) throw new NotFoundException('Checklist item not found');
    await this.ensureCardAccess(item.Checklist.CardId, user.Id);
    Object.assign(item, dto);
    return this.checklistItemRepository.save(item);
  }

  async removeItem(id: string, user: UserEntity): Promise<void> {
    const item = await this.checklistItemRepository.findOneById(id);
    if (!item) throw new NotFoundException('Checklist item not found');
    await this.ensureCardAccess(item.Checklist.CardId, user.Id);
    await this.checklistItemRepository.remove(item);
  }
}
