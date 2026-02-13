import { Injectable } from '@nestjs/common';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { BaseRepository } from './base.repository';
import { DailyUpdateEntity } from 'src/core/database/entities/daily-update.entity';
import { DailyUpdateRole } from 'src/common/types/daily-update-role.enum';
import { DailyUpdateStatus } from 'src/common/types/daily-update-status.enum';

@Injectable()
export class DailyUpdateRepository extends BaseRepository<DailyUpdateEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, DailyUpdateEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findOneById(
    id: string,
    relations?: string[],
  ): Promise<DailyUpdateEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: relations?.length ? relations : undefined,
    });
  }

  async findOneByIdAndOrg(
    id: string,
    orgId: string,
    relations?: string[],
  ): Promise<DailyUpdateEntity | null> {
    return this.repo.findOne({
      where: { Id: id, OrganizationId: orgId },
      relations: relations?.length ? relations : undefined,
    });
  }

  async findByUserAndDate(
    userId: string,
    orgId: string,
    date: string,
  ): Promise<DailyUpdateEntity | null> {
    return this.repo.findOne({
      where: {
        UserId: userId,
        OrganizationId: orgId,
        Date: new Date(date),
      },
    });
  }

  async findAllByOrgPaginated(
    orgId: string,
    skip: number,
    take: number,
    filters: {
      date?: string;
      from?: string;
      to?: string;
      userId?: string;
      role?: DailyUpdateRole;
      status?: DailyUpdateStatus;
      search?: string;
    },
  ): Promise<[DailyUpdateEntity[], number]> {
    const baseWhere: FindOptionsWhere<DailyUpdateEntity> = {
      OrganizationId: orgId,
    };
    if (filters.userId) {
      baseWhere.UserId = filters.userId;
    }
    if (filters.role) {
      baseWhere.Role = filters.role;
    }
    if (filters.status) {
      baseWhere.OverallStatus = filters.status;
    }
    if (filters.date) {
      baseWhere.Date = new Date(filters.date);
    } else if (filters.from && filters.to) {
      baseWhere.Date = Between(new Date(filters.from), new Date(filters.to));
    } else if (filters.from) {
      baseWhere.Date = MoreThanOrEqual(new Date(filters.from));
    } else if (filters.to) {
      baseWhere.Date = LessThanOrEqual(new Date(filters.to));
    }

    const searchTerm = filters.search?.trim();
    const where = searchTerm
      ? [
          { ...baseWhere, Notes: ILike(`%${searchTerm}%`) },
          { ...baseWhere, NextDayPlan: ILike(`%${searchTerm}%`) },
          { ...baseWhere, User: { FullName: ILike(`%${searchTerm}%`) } },
          { ...baseWhere, User: { Email: ILike(`%${searchTerm}%`) } },
          { ...baseWhere, WorkItems: { Description: ILike(`%${searchTerm}%`) } },
          { ...baseWhere, WorkItems: { Comments: ILike(`%${searchTerm}%`) } },
        ]
      : baseWhere;

    return this.repo.findAndCount({
      where: where as FindOptionsWhere<DailyUpdateEntity>,
      relations: ['User', 'WorkItems'],
      order: { Date: 'DESC', SubmittedAt: 'DESC' },
      skip,
      take,
    });
  }

  create(data: Partial<DailyUpdateEntity>): DailyUpdateEntity {
    return this.repo.create(data);
  }

  async save(entity: DailyUpdateEntity): Promise<DailyUpdateEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: DailyUpdateEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
