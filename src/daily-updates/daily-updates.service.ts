import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DailyUpdateRepository } from "src/common/repositories/daily-update.repository";
import { DailyUpdateWorkItemRepository } from "src/common/repositories/daily-update-work-item.repository";
import { OrganizationMemberRepository } from "src/common/repositories/organization-member.repository";
import { OrganizationsService } from "src/organizations/organizations.service";
import { UserEntity } from "src/core/database/entities/user.entity";
import { createPaginatedResponse } from "src/common/dto/paginated-response.dto";
import { DailyUpdateEntity } from "src/core/database/entities/daily-update.entity";
import { DailyUpdateWorkItemEntity } from "src/core/database/entities/daily-update-work-item.entity";
import { DailyUpdateRole } from "src/common/types/daily-update-role.enum";
import { DailyUpdateStatus } from "src/common/types/daily-update-status.enum";
import { WorkItemStatus } from "src/common/types/work-item-status.enum";
import { OrgRole } from "src/common/types/org-role.enum";
import {
  DAILY_TIME_CAP_HOURS,
  WORK_ITEM_TYPES_BY_ROLE,
  WORK_ITEM_TYPES_REQUIRE_REFERENCE,
  WORK_ITEM_TYPES_TICKET,
  WORK_ITEM_TYPES_BID,
} from "src/common/constants/daily-update.constant";
import {
  CreateDailyUpdateDto,
  UpdateDailyUpdateDto,
} from "./dto/daily-update.dto";
import { CardRepository } from "src/common/repositories/card.repository";
import { BidRepository } from "src/common/repositories/bid.repository";

@Injectable()
export class DailyUpdatesService {
  constructor(
    private readonly dailyUpdateRepository: DailyUpdateRepository,
    private readonly dailyUpdateWorkItemRepository: DailyUpdateWorkItemRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly cardRepository: CardRepository,
    private readonly bidRepository: BidRepository,
  ) {}

  private async resolveOrgId(
    user: UserEntity,
    orgId?: string | null,
  ): Promise<string> {
    if (orgId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, orgId);
      if (!isMember)
        throw new ForbiddenException(
          "You are not a member of this organization",
        );
      return orgId;
    }
    const defaultOrg =
      await this.organizationsService.getOrEnsureDefaultOrg(user);
    return defaultOrg.Id;
  }

  private async isOwnerOnlyScope(
    user: UserEntity,
    orgId: string,
  ): Promise<boolean> {
    const membership = await this.orgMemberRepository.findByUserAndOrg(
      user.Id,
      orgId,
    );
    if (!membership) return true;
    return (
      membership.Role !== OrgRole.PROJECT_MANAGER &&
      membership.Role !== OrgRole.ORG_ADMIN
    );
  }

  private validateWorkItems(
    role: DailyUpdateRole,
    items: DailyUpdateWorkItemEntity[],
  ) {
    if (!items.length) {
      throw new BadRequestException("At least one work item is required");
    }

    const allowedTypes = WORK_ITEM_TYPES_BY_ROLE[role] || [];
    items.forEach((item) => {
      if (!item.Type || !allowedTypes.includes(item.Type)) {
        throw new BadRequestException("Invalid work item type for role");
      }
      if (!item.Description?.trim()) {
        throw new BadRequestException("Work item description is required");
      }
      if (
        WORK_ITEM_TYPES_REQUIRE_REFERENCE.has(item.Type) &&
        !item.ReferenceId
      ) {
        throw new BadRequestException(
          "Reference ID required for this work item",
        );
      }
      if (
        item.Status === WorkItemStatus.BLOCKED &&
        !item.BlockerReason?.trim()
      ) {
        throw new BadRequestException(
          "Blocker reason required for blocked item",
        );
      }
      if (item.TimeSpent != null && item.TimeSpent > DAILY_TIME_CAP_HOURS) {
        throw new BadRequestException(
          `Time spent cannot exceed ${DAILY_TIME_CAP_HOURS} hours`,
        );
      }
    });
  }

  private computeOverallStatus(
    status: DailyUpdateStatus,
    items: DailyUpdateWorkItemEntity[],
  ): DailyUpdateStatus {
    const hasBlocked = items.some(
      (item) => item.Status === WorkItemStatus.BLOCKED,
    );
    if (hasBlocked) return DailyUpdateStatus.BLOCKED;
    return status;
  }

  private async validateReferences(
    orgId: string,
    items: DailyUpdateWorkItemEntity[],
  ) {
    for (const item of items) {
      if (!item.ReferenceId) continue;
      if (WORK_ITEM_TYPES_TICKET.has(item.Type)) {
        const card = await this.cardRepository.findOneById(item.ReferenceId, [
          "List",
          "List.Project",
        ]);
        const projectOrgId = card?.List?.Project?.OrganizationId;
        if (!card || projectOrgId !== orgId) {
          throw new BadRequestException("Invalid ticket reference");
        }
      }
      if (WORK_ITEM_TYPES_BID.has(item.Type)) {
        const bid = await this.bidRepository.findOneByIdAndOrg(
          item.ReferenceId,
          orgId,
        );
        if (!bid) throw new BadRequestException("Invalid bid reference");
      }
    }
  }

  private assertCanEdit(update: DailyUpdateEntity, user: UserEntity): void {
    if (update.UserId !== user.Id) {
      throw new ForbiddenException("You cannot edit another user update");
    }
  }

  async create(
    dto: CreateDailyUpdateDto,
    user: UserEntity,
    orgId?: string | null,
  ): Promise<DailyUpdateEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const existing = await this.dailyUpdateRepository.findByUserAndDate(
      user.Id,
      resolvedOrgId,
      dto.Date,
    );
    if (existing) {
      throw new BadRequestException(
        "Daily update already exists for this date",
      );
    }

    const workItems = (dto.WorkItems || []).map((item) =>
      this.dailyUpdateWorkItemRepository.create({
        ...item,
        OrganizationId: resolvedOrgId,
        ExpectedResolutionDate: item.ExpectedResolutionDate
          ? new Date(item.ExpectedResolutionDate)
          : null,
      }),
    );
    this.validateWorkItems(dto.Role, workItems);
    await this.validateReferences(resolvedOrgId, workItems);

    const update = this.dailyUpdateRepository.create({
      OrganizationId: resolvedOrgId,
      UserId: user.Id,
      Date: new Date(dto.Date),
      Role: dto.Role,
      OverallStatus: this.computeOverallStatus(dto.OverallStatus, workItems),
      TotalTimeSpent: dto.TotalTimeSpent ?? null,
      Notes: dto.Notes ?? null,
      NextDayPlan: dto.NextDayPlan ?? null,
      SubmittedAt: new Date(),
      WorkItems: workItems,
      CreatedBy: user,
    });
    return this.dailyUpdateRepository.save(update);
  }

  async findAll(
    user: UserEntity,
    orgId: string | null,
    page: number,
    limit: number,
    filters: {
      date?: string;
      from?: string;
      to?: string;
      userId?: string;
      role?: DailyUpdateRole;
      status?: DailyUpdateStatus;
      search?: string;
    },
  ) {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    if (ownerOnly) filters.userId = user.Id;

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] =
      await this.dailyUpdateRepository.findAllByOrgPaginated(
        resolvedOrgId,
        skip,
        take,
        filters,
      );
    return createPaginatedResponse(items, total, page, take);
  }

  async findOne(
    id: string,
    user: UserEntity,
    orgId?: string | null,
  ): Promise<DailyUpdateEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const update = await this.dailyUpdateRepository.findOneByIdAndOrg(
      id,
      resolvedOrgId,
      ["User", "WorkItems"],
    );
    if (!update) throw new NotFoundException("Daily update not found");
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    if (ownerOnly && update.UserId !== user.Id) {
      throw new ForbiddenException("Access denied");
    }
    return update;
  }

  async update(
    id: string,
    dto: UpdateDailyUpdateDto,
    user: UserEntity,
    orgId?: string | null,
  ): Promise<DailyUpdateEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const update = await this.dailyUpdateRepository.findOneByIdAndOrg(
      id,
      resolvedOrgId,
      ["WorkItems"],
    );
    if (!update) throw new NotFoundException("Daily update not found");
    this.assertCanEdit(update, user);

    if (dto.Date) update.Date = new Date(dto.Date);
    if (dto.Role) update.Role = dto.Role;
    if (dto.OverallStatus) update.OverallStatus = dto.OverallStatus;
    if (dto.TotalTimeSpent !== undefined) {
      update.TotalTimeSpent = dto.TotalTimeSpent ?? null;
    }
    if (dto.Notes !== undefined) update.Notes = dto.Notes ?? null;
    if (dto.NextDayPlan !== undefined)
      update.NextDayPlan = dto.NextDayPlan ?? null;

    if (dto.WorkItems) {
      const workItems = dto.WorkItems.map((item) =>
        this.dailyUpdateWorkItemRepository.create({
          ...item,
          OrganizationId: resolvedOrgId,
          DailyUpdateId: update.Id,
          ExpectedResolutionDate: item.ExpectedResolutionDate
            ? new Date(item.ExpectedResolutionDate)
            : null,
        }),
      );
      this.validateWorkItems(update.Role, workItems);
      await this.validateReferences(resolvedOrgId, workItems);
      update.OverallStatus = this.computeOverallStatus(
        update.OverallStatus,
        workItems,
      );
      await this.dailyUpdateWorkItemRepository.removeByDailyUpdateId(update.Id);
      update.WorkItems = workItems;
    }

    return this.dailyUpdateRepository.save(update);
  }

  async getMissingUpdateBacklog(
    user: UserEntity,
    orgId: string | null,
    date: string,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    if (ownerOnly) {
      throw new ForbiddenException("Access denied");
    }

    const members =
      await this.orgMemberRepository.findMembersByOrgId(resolvedOrgId);
    const memberIds = members.map((m) => m.UserId);
    const [updates] = await this.dailyUpdateRepository.findAllByOrgPaginated(
      resolvedOrgId,
      0,
      5000,
      { date },
    );
    const submittedIds = new Set(updates.map((u) => u.UserId));
    const missing = memberIds
      .filter((id) => !submittedIds.has(id))
      .map((id) => ({
        UserId: id,
        MissedDate: date,
        Details: "No update submitted",
      }));

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const items = missing.slice(skip, skip + take);
    return createPaginatedResponse(items, missing.length, page, take);
  }

  async getBlockerBacklog(
    user: UserEntity,
    orgId: string | null,
    from: string,
    to: string,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    if (ownerOnly) {
      throw new ForbiddenException("Access denied");
    }
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] =
      await this.dailyUpdateWorkItemRepository.findBlockedBacklog(
        resolvedOrgId,
        from,
        to,
        skip,
        take,
      );

    const mapped = items.map((item) => ({
      Id: item.Id,
      UserId: item.DailyUpdate?.UserId,
      Date: item.DailyUpdate?.Date,
      Details: item.BlockerReason || item.Description,
      Reason: item.BlockerReason || undefined,
      DailyUpdateId: item.DailyUpdateId,
    }));

    return createPaginatedResponse(mapped, total, page, take);
  }

  async getOffPlanBacklog(
    user: UserEntity,
    orgId: string | null,
    from: string,
    to: string,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    if (ownerOnly) {
      throw new ForbiddenException("Access denied");
    }
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] =
      await this.dailyUpdateWorkItemRepository.findOffPlanBacklog(
        resolvedOrgId,
        from,
        to,
        Array.from(WORK_ITEM_TYPES_REQUIRE_REFERENCE),
        skip,
        take,
      );

    const mapped = items.map((item) => ({
      Id: item.Id,
      UserId: item.DailyUpdate?.UserId,
      Date: item.DailyUpdate?.Date,
      Details: item.Description,
      DailyUpdateId: item.DailyUpdateId,
    }));

    return createPaginatedResponse(mapped, total, page, take);
  }
}
