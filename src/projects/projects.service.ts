import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_PROJECT_LISTS } from 'src/common/constants/project.constant';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { BidRepository } from 'src/common/repositories/bid.repository';
import { BidStatus } from 'src/common/types/bid-status.enum';
import { OrgRole } from 'src/common/types/org-role.enum';
import { ProjectDeliveryType } from 'src/common/types/project-delivery-type.enum';
import { ProjectStatus } from 'src/common/types/project-status.enum';
import { ProjectEntity } from 'src/core/database/entities/project.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { ListsService } from 'src/lists/lists.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly listsService: ListsService,
    private readonly bidRepository: BidRepository,
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

  async create(dto: CreateProjectDto, user: UserEntity, orgId?: string | null): Promise<ProjectEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId ?? dto.OrganizationId);
    const project = this.projectRepository.create({
      Name: dto.Name,
      Description: dto.Description,
      OrganizationId: resolvedOrgId,
      ClientDisplayName: dto.ClientDisplayName ?? null,
      ProjectOwnerId: dto.ProjectOwnerId ?? null,
      StartDate: dto.StartDate ? new Date(dto.StartDate) : null,
      DeliveryType: dto.DeliveryType ?? ProjectDeliveryType.TIME_AND_MATERIAL,
      Status: dto.Status ?? ProjectStatus.CREATED,
      RiskLevel: dto.RiskLevel ?? null,
      ExternalReferenceId: dto.ExternalReferenceId ?? null,
      Budget: dto.Budget ?? null,
      CreatedBy: user,
    });
    const savedProject = await this.projectRepository.save(project);

    for (let i = 0; i < DEFAULT_PROJECT_LISTS.length; i++) {
      await this.listsService.create(
        { Title: DEFAULT_PROJECT_LISTS[i], ProjectId: savedProject.Id, Position: i },
        user,
      );
    }

    return savedProject;
  }

  async findAll(user: UserEntity, orgId?: string | null): Promise<ProjectEntity[]> {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const projects = await this.projectRepository.findAllByUserAndOrg(user.Id, resolvedOrgId);
    return projects.map((p) => ({
      ...p,
      Description: p.Description ?? null,
      description: p.Description ?? null,
    })) as ProjectEntity[];
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
    const [items, total] = await this.projectRepository.findAllByUserAndOrgPaginated(
      resolvedOrgId,
      skip,
      take,
      sort ?? 'CreatedAt',
      (order ?? 'desc').toUpperCase() as 'ASC' | 'DESC',
    );
    const projects = items.map((p) => ({
      ...p,
      Description: p.Description ?? null,
      description: p.Description ?? null,
    })) as ProjectEntity[];
    return createPaginatedResponse(projects, total, page, take);
  }

  async findOne(id: string, user: UserEntity): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOneByIdAndUser(id, user.Id);
    if (!project) throw new NotFoundException('Project not found');
    if (project.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, project.OrganizationId);
      if (!isMember) throw new ForbiddenException('You do not have access to this project');
    } else if (project.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, user: UserEntity): Promise<ProjectEntity> {
    const project = await this.findOne(id, user);
    if (project.Status === ProjectStatus.CLOSED && dto.Status !== ProjectStatus.CLOSED) {
      throw new BadRequestException('Closed projects are read-only');
    }
    if (dto.Status && dto.Status !== project.Status) {
      this.assertValidStatusTransition(project.Status, dto.Status);
    }
    Object.assign(project, {
      ...dto,
      StartDate: dto.StartDate ? new Date(dto.StartDate) : project.StartDate,
    });
    return this.projectRepository.save(project);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const project = await this.findOne(id, user);
    await this.projectRepository.remove(project);
  }

  async createFromBid(bidId: string, user: UserEntity, orgId?: string | null): Promise<ProjectEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, resolvedOrgId, [
      OrgRole.PROJECT_MANAGER,
    ]);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to create a project from a bid');
    }

    const bid = await this.bidRepository.findOneById(bidId);
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.OrganizationId !== resolvedOrgId) {
      throw new ForbiddenException('You do not have access to this bid');
    }
    if (bid.CurrentStatus !== BidStatus.WON) {
      throw new BadRequestException('Only won bids can be handed off to projects');
    }

    const existing = await this.projectRepository.findOneByBidId(bidId);
    if (existing) {
      return existing;
    }

    const project = this.projectRepository.create({
      Name: bid.BidTitle,
      Description: bid.FinalScopeNotes ?? null,
      OrganizationId: resolvedOrgId,
      BidId: bid.Id,
      ClientDisplayName: bid.ClientDisplayName ?? null,
      FinalAgreedPrice: bid.FinalAgreedPrice ?? null,
      ExpectedStartDate: bid.ExpectedStartDate ?? null,
      FinalScopeNotes: bid.FinalScopeNotes ?? null,
      StartDate: bid.ExpectedStartDate ?? null,
      Status: ProjectStatus.CREATED,
      DeliveryType: ProjectDeliveryType.TIME_AND_MATERIAL,
      CreatedBy: user,
    });
    const savedProject = await this.projectRepository.save(project);

    for (let i = 0; i < DEFAULT_PROJECT_LISTS.length; i++) {
      await this.listsService.create(
        { Title: DEFAULT_PROJECT_LISTS[i], ProjectId: savedProject.Id, Position: i },
        user,
      );
    }

    return savedProject;
  }

  private assertValidStatusTransition(from: ProjectStatus, to: ProjectStatus): void {
    const allowed: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.CREATED]: [ProjectStatus.ONBOARDING, ProjectStatus.ACTIVE],
      [ProjectStatus.ONBOARDING]: [ProjectStatus.ACTIVE, ProjectStatus.PAUSED],
      [ProjectStatus.ACTIVE]: [ProjectStatus.PAUSED, ProjectStatus.COMPLETED],
      [ProjectStatus.PAUSED]: [ProjectStatus.ACTIVE, ProjectStatus.COMPLETED],
      [ProjectStatus.COMPLETED]: [ProjectStatus.CLOSED],
      [ProjectStatus.CLOSED]: [],
    };
    if (!allowed[from]?.includes(to)) {
      throw new BadRequestException(`Invalid project status transition from ${from} to ${to}`);
    }
  }
}
