import { Injectable } from '@nestjs/common';
import { LabelEntity } from 'src/core/database/entities/label.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class LabelRepository extends BaseRepository<LabelEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, LabelEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findByOrgId(orgId: string): Promise<LabelEntity[]> {
    return this.repo.find({
      where: { OrganizationId: orgId },
      order: { CreatedAt: 'ASC' },
    });
  }

  async findOneById(id: string): Promise<LabelEntity | null> {
    return this.repo.findOne({ where: { Id: id } });
  }

  create(data: Partial<LabelEntity>): LabelEntity {
    return this.repo.create(data);
  }

  async save(entity: LabelEntity): Promise<LabelEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: LabelEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
