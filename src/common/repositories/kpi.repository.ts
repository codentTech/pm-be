import { Injectable } from '@nestjs/common';
import { KpiEntity } from 'src/core/database/entities/kpi.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class KpiRepository extends BaseRepository<KpiEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, KpiEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findAllByUserId(userId: string): Promise<KpiEntity[]> {
    return this.repo.find({
      where: { CreatedBy: { Id: userId } },
      order: { CreatedAt: 'DESC' },
    });
  }

  async findOneByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<KpiEntity | null> {
    return this.repo.findOne({
      where: { Id: id, CreatedBy: { Id: userId } },
      relations: ['CreatedBy'],
    });
  }

  create(data: Partial<KpiEntity>): KpiEntity {
    return this.repo.create(data);
  }

  async save(entity: KpiEntity): Promise<KpiEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: KpiEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
