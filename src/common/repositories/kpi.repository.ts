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

  async findAllByUserAndOrg(userId: string, orgId: string): Promise<KpiEntity[]> {
    return this.repo.find({
      where: { OrganizationId: orgId },
      order: { CreatedAt: 'DESC' },
    });
  }

  async findAllByUserAndOrgPaginated(
    userId: string,
    orgId: string,
    skip: number,
    take: number,
    sort = 'CreatedAt',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[KpiEntity[], number]> {
    const orderOpt: Record<string, 'ASC' | 'DESC'> = {};
    const validSort = ['CreatedAt', 'UpdatedAt', 'Name', 'DueDate', 'TargetValue', 'CurrentValue', 'Period'].includes(sort)
      ? sort
      : 'CreatedAt';
    orderOpt[validSort] = (order ?? 'DESC').toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const [items, total] = await this.repo.findAndCount({
      where: { OrganizationId: orgId },
      order: orderOpt,
      skip,
      take,
    });
    return [items, total];
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

  async findOneById(id: string): Promise<KpiEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: ['CreatedBy', 'Organization'],
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
