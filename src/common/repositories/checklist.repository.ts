import { Injectable } from '@nestjs/common';
import { ChecklistEntity } from 'src/core/database/entities/checklist.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class ChecklistRepository extends BaseRepository<ChecklistEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChecklistEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findByCardId(cardId: string): Promise<ChecklistEntity[]> {
    return this.repo.find({
      where: { CardId: cardId },
      relations: ['Items'],
      order: { Position: 'ASC', Items: { Position: 'ASC' } },
    });
  }

  async findOneById(id: string): Promise<ChecklistEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: ['Items', 'Card'],
    });
  }

  create(data: Partial<ChecklistEntity>): ChecklistEntity {
    return this.repo.create(data);
  }

  async save(entity: ChecklistEntity): Promise<ChecklistEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: ChecklistEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
