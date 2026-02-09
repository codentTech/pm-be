import { Injectable } from '@nestjs/common';
import { CommentEntity } from 'src/core/database/entities/comment.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class CommentRepository extends BaseRepository<CommentEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, CommentEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findByCardId(cardId: string): Promise<CommentEntity[]> {
    return this.repo.find({
      where: { CardId: cardId },
      relations: ['User'],
      order: { CreatedAt: 'ASC' },
    });
  }

  async findByCardIdPaginated(
    cardId: string,
    skip: number,
    take: number,
  ): Promise<[CommentEntity[], number]> {
    return this.repo.findAndCount({
      where: { CardId: cardId },
      relations: ['User'],
      order: { CreatedAt: 'ASC' },
      skip,
      take,
    });
  }

  async findOneById(id: string): Promise<CommentEntity | null> {
    return this.repo.findOne({ where: { Id: id }, relations: ['Card', 'User'] });
  }

  create(data: Partial<CommentEntity>): CommentEntity {
    return this.repo.create(data);
  }

  async save(entity: CommentEntity): Promise<CommentEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: CommentEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
