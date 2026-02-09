import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CardAssigneeRepository } from 'src/common/repositories/card-assignee.repository';
import { CardLabelRepository } from 'src/common/repositories/card-label.repository';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { LabelRepository } from 'src/common/repositories/label.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CardEntity } from 'src/core/database/entities/card.entity';
import { BoardGateway } from 'src/websocket/board.gateway';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';

@Injectable()
export class CardsService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly cardLabelRepository: CardLabelRepository,
    private readonly cardAssigneeRepository: CardAssigneeRepository,
    private readonly labelRepository: LabelRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly boardGateway: BoardGateway,
  ) {}

  async create(dto: CreateCardDto, user: UserEntity): Promise<CardEntity> {
    const list = await this.assertListOwnership(dto.ListId, user.Id);

    const position =
      dto.Position ??
      (await this.cardRepository.getNextPositionForList(dto.ListId));
    const card = this.cardRepository.create({
      ...dto,
      Position: position,
      DueDate: dto.DueDate ? new Date(dto.DueDate) : undefined,
      CreatedBy: user,
    });
    const saved = await this.cardRepository.save(card);
    if (list?.BoardId) {
      this.boardGateway.emitCardCreated(list.BoardId, {
        card: saved,
        listId: dto.ListId,
      });
    }
    return saved;
  }

  async findOne(id: string, user: UserEntity): Promise<CardEntity> {
    const card = await this.cardRepository.findOneById(id, [
      'List',
      'List.Board',
      'List.Board.CreatedBy',
      'CardLabels',
      'CardLabels.Label',
      'CardAssignees',
      'CardAssignees.User',
    ]);
    if (!card) throw new NotFoundException('Card not found');
    const board = card.List?.Board;
    if (board?.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, board.OrganizationId);
      if (!isMember) throw new ForbiddenException('Access denied');
    } else if (board?.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('Access denied');
    }
    return card;
  }

  async update(id: string, dto: UpdateCardDto, user: UserEntity): Promise<CardEntity> {
    const card = await this.findOne(id, user);
    const prevListId = card.ListId;
    const list = await this.listRepository.findOneById(prevListId, ['Board']);
    const boardId = list?.BoardId;

    if (dto.ListId && dto.ListId !== card.ListId) {
      await this.assertListOwnership(dto.ListId, user.Id);
      card.ListId = dto.ListId;
    }
    if (dto.DueDate !== undefined) {
      card.DueDate = dto.DueDate ? new Date(dto.DueDate) : null;
    }
    if (dto.Title !== undefined) card.Title = dto.Title;
    if (dto.Description !== undefined) card.Description = dto.Description;
    if (dto.Position !== undefined) card.Position = dto.Position;

    // Detach relations before save - TypeORM uses relation values over column values.
    // List: must detach so our ListId update is persisted (else List relation overwrites it).
    // CardLabels/CardAssignees: we replace them separately via setLabelsForCard/setAssigneesForCard.
    card.List = undefined;
    card.CardLabels = undefined;
    card.CardAssignees = undefined;

    const saved = await this.cardRepository.save(card);

    if (dto.LabelIds !== undefined) {
      const listWithBoard = await this.listRepository.findOneById(saved.ListId, ['Board']);
      const orgId = listWithBoard?.Board?.OrganizationId;
      if (orgId) {
        const orgLabels = await this.labelRepository.findByOrgId(orgId);
        const validIds = dto.LabelIds.filter((lid) =>
          orgLabels.some((l) => l.Id === lid),
        );
        await this.cardLabelRepository.setLabelsForCard(saved.Id, validIds);
      }
    }
    if (dto.AssigneeIds !== undefined && saved?.Id) {
      const listWithBoard = await this.listRepository.findOneById(saved.ListId, ['Board']);
      const orgId = listWithBoard?.Board?.OrganizationId;
      if (orgId) {
        const memberChecks = await Promise.all(
          dto.AssigneeIds.map((uid) => this.orgMemberRepository.isMember(uid, orgId)),
        );
        const validAssigneeIds = dto.AssigneeIds.filter((_, i) => memberChecks[i]);
        await this.cardAssigneeRepository.setAssigneesForCard(saved.Id, validAssigneeIds);
      }
    }

    const savedWithRelations = await this.cardRepository.findOneById(saved.Id, [
      'CardLabels',
      'CardLabels.Label',
      'CardAssignees',
      'CardAssignees.User',
    ]);

    if (boardId) {
      if (dto.ListId && dto.ListId !== prevListId) {
        this.boardGateway.emitCardMoved(boardId, {
          cardId: saved.Id,
          fromListId: prevListId,
          toListId: dto.ListId,
          position: saved.Position ?? 0,
        });
      } else {
        this.boardGateway.emitCardUpdated(boardId, {
          card: savedWithRelations ?? saved,
        });
      }
    }
    return savedWithRelations ?? saved;
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const card = await this.findOne(id, user);
    const list = await this.listRepository.findOneById(card.ListId, ['Board']);
    const boardId = list?.BoardId;
    await this.cardRepository.remove(card);
    if (boardId) {
      this.boardGateway.emitCardDeleted(boardId, {
        cardId: id,
        listId: card.ListId,
      });
    }
  }

  private async assertListOwnership(
    listId: string,
    userId: string,
  ): Promise<{ BoardId: string; OrganizationId?: string } | null> {
    const list = await this.listRepository.findOneById(listId, [
      'Board',
      'Board.CreatedBy',
    ]);
    if (!list) throw new NotFoundException('List not found');
    const board = list.Board;
    if (board?.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(userId, board.OrganizationId);
      if (!isMember) throw new ForbiddenException('Access denied');
    } else if (board?.CreatedBy?.Id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return list;
  }
}
