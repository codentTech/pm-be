import { Injectable } from '@nestjs/common';
import { CardEntity } from 'src/core/database/entities/card.entity';
import { DataSource } from 'typeorm';
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
