import { Injectable } from '@nestjs/common';
import { BoardEntity } from 'src/core/database/entities/board.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class BoardRepository extends BaseRepository<BoardEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, BoardEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  private static readonly BOARD_WITH_LISTS_RELATIONS = [
    'Lists',
    'Lists.Cards',
    'Lists.Cards.CardLabels',
    'Lists.Cards.CardLabels.Label',
    'Lists.Cards.CardAssignees',
    'Lists.Cards.CardAssignees.User',
    'Lists.Cards.Attachments',
    'Lists.Cards.Comments',
    'Lists.Cards.Comments.User',
    'Lists.Cards.Checklists',
    'Lists.Cards.Checklists.Items',
  ] as const;

  private static readonly BOARD_ORDER = {
    CreatedAt: 'DESC' as const,
    Lists: { Position: 'ASC' as const, Cards: { Position: 'ASC' as const } },
  };

  async findAllByUserId(userId: string): Promise<BoardEntity[]> {
    return this.repo.find({
      where: [{ CreatedBy: { Id: userId } }, { OrganizationId: null as any }],
      relations: [...BoardRepository.BOARD_WITH_LISTS_RELATIONS],
      order: BoardRepository.BOARD_ORDER,
    });
  }

  async findAllByUserAndOrg(userId: string, orgId: string): Promise<BoardEntity[]> {
    return this.repo.find({
      where: { OrganizationId: orgId },
      relations: [...BoardRepository.BOARD_WITH_LISTS_RELATIONS],
      order: BoardRepository.BOARD_ORDER,
    });
  }

  async findAllByUserAndOrgPaginated(
    orgId: string,
    skip: number,
    take: number,
    sort = 'CreatedAt',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[BoardEntity[], number]> {
    const validSort = ['CreatedAt', 'UpdatedAt', 'Name'].includes(sort) ? sort : 'CreatedAt';
    const orderOpt: Record<string, 'ASC' | 'DESC'> = {};
    orderOpt[validSort] = order;
    const [items, total] = await this.repo.findAndCount({
      where: { OrganizationId: orgId },
      relations: [...BoardRepository.BOARD_WITH_LISTS_RELATIONS],
      order: { ...orderOpt, Lists: { Position: 'ASC' as const, Cards: { Position: 'ASC' as const } } },
      skip,
      take,
    });
    return [items, total];
  }

  async findOneByIdAndUser(id: string, userId: string): Promise<BoardEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: [...BoardRepository.BOARD_WITH_LISTS_RELATIONS, 'CreatedBy', 'Organization'],
      order: BoardRepository.BOARD_ORDER,
    });
  }

  async findOneByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<BoardEntity | null> {
    return this.repo.findOne({
      where: { Id: id, CreatedBy: { Id: userId } },
      relations: [...BoardRepository.BOARD_WITH_LISTS_RELATIONS, 'CreatedBy'],
      order: BoardRepository.BOARD_ORDER,
    });
  }

  async findOneById(
    id: string,
    relations?: string[],
  ): Promise<BoardEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: relations?.length ? relations : undefined,
    });
  }

  create(data: Partial<BoardEntity>): BoardEntity {
    return this.repo.create(data);
  }

  async save(entity: BoardEntity): Promise<BoardEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: BoardEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
