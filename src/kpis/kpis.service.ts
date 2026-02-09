import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { KpiRepository } from 'src/common/repositories/kpi.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { KpiEntity } from 'src/core/database/entities/kpi.entity';
import { CreateKpiDto, UpdateKpiDto } from './dto/kpi.dto';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';

@Injectable()
export class KpisService {
  constructor(
    private readonly kpiRepository: KpiRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  private async resolveOrgId(user: UserEntity, orgId?: string | null): Promise<string> {
    if (orgId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, orgId);
      if (!isMember) throw new ForbiddenException('You are not a member of this organization');
      return orgId;
    }
    const defaultOrg = await this.organizationsService.getOrEnsureDefaultOrg(user);
    return defaultOrg.Id;
  }

  async create(dto: CreateKpiDto, user: UserEntity, orgId?: string | null): Promise<KpiEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId ?? dto.OrganizationId);
    const value = dto.Value ?? 0;
    const kpi = this.kpiRepository.create({
      OrganizationId: resolvedOrgId,
      Name: dto.Name,
      TargetValue: 0,
      CurrentValue: value,
      Unit: null,
      Period: dto.Period,
      DueDate: dto.DueDate ? new Date(dto.DueDate) : undefined,
      Notes: dto.Notes,
      CreatedBy: user,
    });
    return this.kpiRepository.save(kpi);
  }

  async findAll(user: UserEntity, orgId?: string | null): Promise<KpiEntity[]> {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    return this.kpiRepository.findAllByUserAndOrg(user.Id, resolvedOrgId);
  }

  async findAllPaginated(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
    sort?: string,
    order?: 'asc' | 'desc',
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.kpiRepository.findAllByUserAndOrgPaginated(
      user.Id,
      resolvedOrgId,
      skip,
      take,
      sort ?? 'CreatedAt',
      (order ?? 'desc').toUpperCase() as 'ASC' | 'DESC',
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async findOne(id: string, user: UserEntity): Promise<KpiEntity> {
    const kpi = await this.kpiRepository.findOneById(id);
    if (!kpi) throw new NotFoundException('KPI not found');
    if (kpi.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, kpi.OrganizationId);
      if (!isMember) throw new ForbiddenException('You do not have access to this KPI');
    } else if (kpi.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('You do not have access to this KPI');
    }
    return kpi;
  }

  async update(id: string, dto: UpdateKpiDto, user: UserEntity): Promise<KpiEntity> {
    const kpi = await this.findOne(id, user);
    const { DueDate, Value, ...rest } = dto;
    Object.assign(kpi, rest);
    if (Value !== undefined) kpi.CurrentValue = Value;
    if (DueDate !== undefined) kpi.DueDate = DueDate ? new Date(DueDate) : null;
    return this.kpiRepository.save(kpi);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const kpi = await this.findOne(id, user);
    await this.kpiRepository.remove(kpi);
  }
}
