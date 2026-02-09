import { Injectable } from '@nestjs/common';
import { AttachmentEntity } from 'src/core/database/entities/attachment.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class AttachmentRepository extends BaseRepository<AttachmentEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, AttachmentEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findByCardId(cardId: string): Promise<AttachmentEntity[]> {
    return this.repo.find({
      where: { CardId: cardId },
      order: { CreatedAt: 'ASC' },
    });
  }

  async findByCardIdPaginated(
    cardId: string,
    skip: number,
    take: number,
  ): Promise<[AttachmentEntity[], number]> {
    return this.repo.findAndCount({
      where: { CardId: cardId },
      order: { CreatedAt: 'ASC' },
      skip,
      take,
    });
  }

  async findOneById(id: string): Promise<AttachmentEntity | null> {
    return this.repo.findOne({ where: { Id: id }, relations: ['Card'] });
  }

  create(data: Partial<AttachmentEntity>): AttachmentEntity {
    return this.repo.create(data);
  }

  async save(entity: AttachmentEntity): Promise<AttachmentEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: AttachmentEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
