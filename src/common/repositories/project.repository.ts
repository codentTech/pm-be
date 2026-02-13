import { Injectable } from '@nestjs/common';
import { ProjectEntity } from 'src/core/database/entities/project.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProjectRepository extends BaseRepository<ProjectEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, ProjectEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  private static readonly PROJECT_WITH_LISTS_RELATIONS = [
    'Lists',
    'Lists.Cards',
    'Lists.Cards.CardLabels',
    'Lists.Cards.CardLabels.Label',
    'Lists.Cards.CardAssignees',
    'Lists.Cards.CardAssignees.User',
    'Lists.Cards.Attachments',
    'Lists.Cards.Comments',
    'Lists.Cards.Comments.User',
    'Lists.Cards.Checklists',
    'Lists.Cards.Checklists.Items',
  ] as const;

  private static readonly PROJECT_ORDER = {
    CreatedAt: 'DESC' as const,
    Lists: { Position: 'ASC' as const, Cards: { Position: 'ASC' as const } },
  };

  async findAllByUserId(userId: string): Promise<ProjectEntity[]> {
    return this.repo.find({
      where: [{ CreatedBy: { Id: userId } }, { OrganizationId: null as any }],
      relations: [...ProjectRepository.PROJECT_WITH_LISTS_RELATIONS],
      order: ProjectRepository.PROJECT_ORDER,
    });
  }

  async findAllByUserAndOrg(userId: string, orgId: string): Promise<ProjectEntity[]> {
    return this.repo.find({
      where: { OrganizationId: orgId },
      relations: [...ProjectRepository.PROJECT_WITH_LISTS_RELATIONS],
      order: ProjectRepository.PROJECT_ORDER,
    });
  }

  async findAllByUserAndOrgPaginated(
    orgId: string,
    skip: number,
    take: number,
    sort = 'CreatedAt',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[ProjectEntity[], number]> {
    const validSort = ['CreatedAt', 'UpdatedAt', 'Name'].includes(sort) ? sort : 'CreatedAt';
    const orderOpt: Record<string, 'ASC' | 'DESC'> = {};
    orderOpt[validSort] = order;
    const [items, total] = await this.repo.findAndCount({
      where: { OrganizationId: orgId },
      relations: [...ProjectRepository.PROJECT_WITH_LISTS_RELATIONS],
      order: { ...orderOpt, Lists: { Position: 'ASC' as const, Cards: { Position: 'ASC' as const } } },
      skip,
      take,
    });
    return [items, total];
  }

  async findOneByIdAndUser(id: string, userId: string): Promise<ProjectEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: [...ProjectRepository.PROJECT_WITH_LISTS_RELATIONS, 'CreatedBy', 'Organization'],
      order: ProjectRepository.PROJECT_ORDER,
    });
  }

  async findOneByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<ProjectEntity | null> {
    return this.repo.findOne({
      where: { Id: id, CreatedBy: { Id: userId } },
      relations: [...ProjectRepository.PROJECT_WITH_LISTS_RELATIONS, 'CreatedBy'],
      order: ProjectRepository.PROJECT_ORDER,
    });
  }

  async findOneById(
    id: string,
    relations?: string[],
  ): Promise<ProjectEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: relations?.length ? relations : undefined,
    });
  }

  async findOneByBidId(bidId: string): Promise<ProjectEntity | null> {
    return this.repo.findOne({
      where: { BidId: bidId },
    });
  }

  create(data: Partial<ProjectEntity>): ProjectEntity {
    return this.repo.create(data);
  }

  async save(entity: ProjectEntity): Promise<ProjectEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: ProjectEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
