import { Injectable } from '@nestjs/common';
import { ChecklistItemEntity } from 'src/core/database/entities/checklist-item.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class ChecklistItemRepository extends BaseRepository<ChecklistItemEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChecklistItemEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findByChecklistId(checklistId: string): Promise<ChecklistItemEntity[]> {
    return this.repo.find({
      where: { ChecklistId: checklistId },
      order: { Position: 'ASC' },
    });
  }

  async findOneById(id: string): Promise<ChecklistItemEntity | null> {
    return this.repo.findOne({ where: { Id: id }, relations: ['Checklist'] });
  }

  create(data: Partial<ChecklistItemEntity>): ChecklistItemEntity {
    return this.repo.create(data);
  }

  async save(entity: ChecklistItemEntity): Promise<ChecklistItemEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: ChecklistItemEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
