import { Injectable } from '@nestjs/common';
import { ListEntity } from 'src/core/database/entities/list.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class ListRepository extends BaseRepository<ListEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, ListEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findAllByBoardId(boardId: string): Promise<ListEntity[]> {
    return this.repo.find({
      where: { BoardId: boardId },
      relations: ['Cards'],
      order: { Position: 'ASC', Cards: { Position: 'ASC' } },
    });
  }

  async findOneById(
    id: string,
    relations?: string[],
  ): Promise<ListEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: relations?.length ? relations : undefined,
    });
  }

  async getNextPositionForBoard(boardId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('list')
      .where('list.BoardId = :boardId', { boardId })
      .select('COALESCE(MAX(list.Position), 0) + 1', 'next')
      .getRawOne<{ next: string }>();
    return result?.next ? parseInt(result.next, 10) : 1;
  }

  create(data: Partial<ListEntity>): ListEntity {
    return this.repo.create(data);
  }

  async save(entity: ListEntity): Promise<ListEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: ListEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
