import { Injectable } from '@nestjs/common';
import { Between, DataSource, In, IsNull } from 'typeorm';
import { BaseRepository } from './base.repository';
import { DailyUpdateWorkItemEntity } from 'src/core/database/entities/daily-update-work-item.entity';
import { WorkItemStatus } from 'src/common/types/work-item-status.enum';

@Injectable()
export class DailyUpdateWorkItemRepository extends BaseRepository<DailyUpdateWorkItemEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, DailyUpdateWorkItemEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async removeByDailyUpdateId(updateId: string): Promise<void> {
    await this.repo.delete({ DailyUpdateId: updateId });
  }

  async findBlockedBacklog(
    orgId: string,
    from: string,
    to: string,
    skip: number,
    take: number,
  ): Promise<[DailyUpdateWorkItemEntity[], number]> {
    return this.repo.findAndCount({
      where: {
        OrganizationId: orgId,
        Status: WorkItemStatus.BLOCKED,
        DailyUpdate: {
          Date: Between(new Date(from), new Date(to)),
        },
      },
      relations: ['DailyUpdate', 'DailyUpdate.User'],
      order: { DailyUpdate: { Date: 'DESC' } },
      skip,
      take,
    });
  }

  async findOffPlanBacklog(
    orgId: string,
    from: string,
    to: string,
    typesRequiringRef: string[],
    skip: number,
    take: number,
  ): Promise<[DailyUpdateWorkItemEntity[], number]> {
    return this.repo.findAndCount({
      where: {
        OrganizationId: orgId,
        Type: In(typesRequiringRef),
        ReferenceId: IsNull(),
        DailyUpdate: {
          Date: Between(new Date(from), new Date(to)),
        },
      },
      relations: ['DailyUpdate', 'DailyUpdate.User'],
      order: { DailyUpdate: { Date: 'DESC' } },
      skip,
      take,
    });
  }

  create(data: Partial<DailyUpdateWorkItemEntity>): DailyUpdateWorkItemEntity {
    return this.repo.create(data);
  }

  async save(entity: DailyUpdateWorkItemEntity): Promise<DailyUpdateWorkItemEntity> {
    return this.repo.save(entity);
  }

  async saveMany(
    entities: DailyUpdateWorkItemEntity[],
  ): Promise<DailyUpdateWorkItemEntity[]> {
    return this.repo.save(entities);
  }
}
