import { Injectable } from '@nestjs/common';
import { CardEntity } from 'src/core/database/entities/card.entity';
import { TicketStatus } from 'src/common/types/ticket-status.enum';
import { TicketType } from 'src/common/types/ticket-type.enum';
import { DataSource, In, IsNull, Not } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class CardRepository extends BaseRepository<CardEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, CardEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findOneById(
    id: string,
    relations?: string[],
  ): Promise<CardEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: relations?.length ? relations : undefined,
    });
  }

  async getNextPositionForList(listId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('card')
      .where('card.ListId = :listId', { listId })
      .select('COALESCE(MAX(card.Position), 0) + 1', 'next')
      .getRawOne<{ next: string }>();
    return result?.next ? parseInt(result.next, 10) : 1;
  }

  async findProductBacklog(
    listIds: string[],
    skip: number,
    take: number,
  ): Promise<[CardEntity[], number]> {
    if (!Array.isArray(listIds) || listIds.length === 0) {
      return [[], 0];
    }
    return this.repo.findAndCount({
      where: {
        ListId: In(listIds),
        Status: In([TicketStatus.BACKLOG, TicketStatus.READY]),
        SprintId: IsNull(),
      },
      relations: ['List'],
      order: { CreatedAt: 'DESC' },
      skip,
      take,
    });
  }

  async findSprintBacklog(
    listIds: string[],
    sprintId: string,
    skip: number,
    take: number,
  ): Promise<[CardEntity[], number]> {
    if (!Array.isArray(listIds) || listIds.length === 0) {
      return [[], 0];
    }
    return this.repo.findAndCount({
      where: {
        ListId: In(listIds),
        SprintId: sprintId,
      },
      relations: ['List'],
      order: { Position: 'ASC' },
      skip,
      take,
    });
  }

  async findBugBacklog(
    listIds: string[],
    skip: number,
    take: number,
  ): Promise<[CardEntity[], number]> {
    if (!Array.isArray(listIds) || listIds.length === 0) {
      return [[], 0];
    }
    return this.repo.findAndCount({
      where: {
        ListId: In(listIds),
        TicketType: TicketType.BUG,
        Status: Not(TicketStatus.DONE),
      },
      relations: ['List'],
      order: { UpdatedAt: 'DESC' },
      skip,
      take,
    });
  }

  async findBlockedBacklog(
    listIds: string[],
    skip: number,
    take: number,
  ): Promise<[CardEntity[], number]> {
    if (!Array.isArray(listIds) || listIds.length === 0) {
      return [[], 0];
    }
    return this.repo.findAndCount({
      where: {
        ListId: In(listIds),
        Status: TicketStatus.BLOCKED,
      },
      relations: ['List'],
      order: { UpdatedAt: 'ASC' },
      skip,
      take,
    });
  }

  create(data: Partial<CardEntity>): CardEntity {
    return this.repo.create(data);
  }

  async save(entity: CardEntity): Promise<CardEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: CardEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
