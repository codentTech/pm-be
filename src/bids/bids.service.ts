import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BidRepository } from "src/common/repositories/bid.repository";
import { OrganizationMemberRepository } from "src/common/repositories/organization-member.repository";
import { OrganizationsService } from "src/organizations/organizations.service";
import { UserEntity } from "src/core/database/entities/user.entity";
import { BidEntity } from "src/core/database/entities/bid.entity";
import { createPaginatedResponse } from "src/common/dto/paginated-response.dto";
import {
  CreateBidDto,
  TransitionBidStatusDto,
  UpdateBidDto,
} from "./dto/bid.dto";
import { BidLossReason } from "src/common/types/bid-loss-reason.enum";
import { OrgRole } from "src/common/types/org-role.enum";
import {
  BidStatus,
  BID_TERMINAL_STATES,
} from "src/common/types/bid-status.enum";
import {
  BID_DRAFT_AGING_DAYS,
  BID_FOLLOW_UP_SLA_DAYS,
  BID_GHOSTED_SUGGEST_DAYS,
  BID_VALID_TRANSITIONS,
} from "src/common/constants/bid.constant";
import { BidStatusHistoryEntry } from "src/common/types/bid-status-history.interface";

@Injectable()
export class BidsService {
  constructor(
    private readonly bidRepository: BidRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly orgMemberRepository: OrganizationMemberRepository,
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
    orgId: string | null,
  ): Promise<boolean> {
    if (!orgId) return true;
    const membership = await this.orgMemberRepository.findByUserAndOrg(
      user.Id,
      orgId,
    );
    if (!membership) return true;
    return membership.Role !== OrgRole.PROJECT_MANAGER;
  }

  private async getThresholds(orgId: string) {
    try {
      const org = await this.organizationsService.findById(orgId);
      return {
        draftAgingDays: org?.DraftAgingDays ?? BID_DRAFT_AGING_DAYS,
        followUpSlaDays: org?.FollowUpSlaDays ?? BID_FOLLOW_UP_SLA_DAYS,
        ghostedSuggestDays: org?.GhostedSuggestDays ?? BID_GHOSTED_SUGGEST_DAYS,
      };
    } catch {
      return {
        draftAgingDays: BID_DRAFT_AGING_DAYS,
        followUpSlaDays: BID_FOLLOW_UP_SLA_DAYS,
        ghostedSuggestDays: BID_GHOSTED_SUGGEST_DAYS,
      };
    }
  }

  private async assertCanEdit(bid: BidEntity, user: UserEntity): Promise<void> {
    if (BID_TERMINAL_STATES.includes(bid.CurrentStatus as BidStatus)) {
      throw new BadRequestException(
        "Bid is in terminal state and cannot be edited",
      );
    }
    if (bid.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(
        user.Id,
        bid.OrganizationId,
      );
      if (!isMember)
        throw new ForbiddenException("You do not have access to this bid");
      const ownerOnly = await this.isOwnerOnlyScope(user, bid.OrganizationId);
      if (ownerOnly && bid.OwnerId !== user.Id) {
        throw new ForbiddenException("You do not have access to this bid");
      }
    } else if (bid.OwnerId !== user.Id) {
      throw new ForbiddenException("You do not have access to this bid");
    }
  }

  private async assertCanTransition(
    bid: BidEntity,
    user: UserEntity,
  ): Promise<void> {
    if (BID_TERMINAL_STATES.includes(bid.CurrentStatus as BidStatus)) {
      throw new BadRequestException("Bid is in terminal state");
    }
    await this.assertCanEdit(bid, user);
  }

  private validateTransition(
    from: BidStatus,
    to: BidStatus,
    dto: TransitionBidStatusDto,
  ): void {
    const allowed = BID_VALID_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(`Invalid transition from ${from} to ${to}`);
    }
    if (to === BidStatus.INTERVIEW && !dto.InterviewDate) {
      throw new BadRequestException(
        "Interview date is required when moving to Interview",
      );
    }
    if (to === BidStatus.LOST && !dto.LossReason && !dto.LossReasonOther) {
      throw new BadRequestException(
        "Loss reason is required when marking bid as Lost",
      );
    }
    if (
      to === BidStatus.LOST &&
      dto.LossReason === BidLossReason.OTHER &&
      !dto.LossReasonOther?.trim()
    ) {
      throw new BadRequestException(
        "Loss reason details required when LossReason is Other",
      );
    }
    if (to === BidStatus.WITHDRAWN && !dto.WithdrawalReason) {
      throw new BadRequestException(
        "Withdrawal reason is required when withdrawing bid",
      );
    }
    if (
      to === BidStatus.WON &&
      (dto.FinalAgreedPrice == null || !dto.ExpectedStartDate)
    ) {
      throw new BadRequestException(
        "Final agreed price and expected start date are required for Won",
      );
    }
  }

  private appendStatusHistory(
    bid: BidEntity,
    newStatus: BidStatus,
    userId: string,
    reason?: string,
  ): void {
    const history: BidStatusHistoryEntry[] = Array.isArray(bid.StatusHistory)
      ? [...bid.StatusHistory]
      : [];
    history.push({
      Status: newStatus,
      Timestamp: new Date().toISOString(),
      UserId: userId,
      Reason: reason,
    });
    bid.StatusHistory = history;
  }

  async create(
    dto: CreateBidDto,
    user: UserEntity,
    orgId?: string | null,
  ): Promise<BidEntity> {
    const resolvedOrgId = await this.resolveOrgId(
      user,
      orgId ?? dto.OrganizationId,
    );
    const status = dto.CurrentStatus ?? BidStatus.DRAFT;

    const bid = this.bidRepository.create({
      OrganizationId: resolvedOrgId,
      OwnerId: user.Id,
      Owner: user,
      Platform: dto.Platform,
      JobUrlOrReference: dto.JobUrlOrReference,
      ClientDisplayName: dto.ClientDisplayName,
      BidTitle: dto.BidTitle,
      ClientBudget: dto.ClientBudget ?? null,
      ProposedPrice: dto.ProposedPrice,
      Currency: dto.Currency ?? "USD",
      EstimatedEffort: dto.EstimatedEffort,
      SkillsTags: dto.SkillsTags ?? [],
      SubmissionDate: new Date(dto.SubmissionDate),
      CurrentStatus: status,
      Probability: dto.Probability ?? null,
      CompetitorNotes: dto.CompetitorNotes ?? null,
      RiskFlags: dto.RiskFlags ?? null,
      InternalComments: dto.InternalComments ?? null,
      InterviewDate: dto.InterviewDate ? new Date(dto.InterviewDate) : null,
      InterviewOutcome: dto.InterviewOutcome ?? null,
      StatusHistory: [
        {
          Status: status,
          Timestamp: new Date().toISOString(),
          UserId: user.Id,
        },
      ],
      LastStatusAt: new Date(),
      CreatedBy: user,
    });

    return this.bidRepository.save(bid);
  }

  async findAllPaginated(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
    sort?: string,
    order?: "asc" | "desc",
    status?: BidStatus,
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.bidRepository.findAllByOrgPaginated(
      resolvedOrgId,
      skip,
      take,
      sort ?? "CreatedAt",
      (order ?? "desc").toUpperCase() as "ASC" | "DESC",
      status,
      ownerOnly ? user.Id : undefined,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async findOne(id: string, user: UserEntity): Promise<BidEntity> {
    const bid = await this.bidRepository.findOneById(id);
    if (!bid) throw new NotFoundException("Bid not found");
    if (bid.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(
        user.Id,
        bid.OrganizationId,
      );
      if (!isMember)
        throw new ForbiddenException("You do not have access to this bid");
      const ownerOnly = await this.isOwnerOnlyScope(user, bid.OrganizationId);
      if (ownerOnly && bid.OwnerId !== user.Id) {
        throw new ForbiddenException("You do not have access to this bid");
      }
    } else if (bid.OwnerId !== user.Id) {
      throw new ForbiddenException("You do not have access to this bid");
    }
    return bid;
  }

  async update(
    id: string,
    dto: UpdateBidDto,
    user: UserEntity,
  ): Promise<BidEntity> {
    const bid = await this.findOne(id, user);
    await this.assertCanEdit(bid, user);

    if (dto.CurrentStatus && dto.CurrentStatus !== bid.CurrentStatus) {
      throw new BadRequestException(
        "Use the transition endpoint to change bid status",
      );
    }

    const { SubmissionDate, InterviewDate, ...rest } = dto;
    Object.assign(bid, rest);
    if (SubmissionDate) bid.SubmissionDate = new Date(SubmissionDate);
    if (InterviewDate !== undefined) {
      bid.InterviewDate = InterviewDate ? new Date(InterviewDate) : null;
    }

    return this.bidRepository.save(bid);
  }

  async transitionStatus(
    id: string,
    dto: TransitionBidStatusDto,
    user: UserEntity,
  ): Promise<BidEntity> {
    const bid = await this.findOne(id, user);
    await this.assertCanTransition(bid, user);

    const from = bid.CurrentStatus as BidStatus;
    const to = dto.Status;

    this.validateTransition(from, to, dto);

    bid.CurrentStatus = to;
    const reason =
      dto.LossReasonOther ?? dto.LossReason ?? dto.WithdrawalReason;
    this.appendStatusHistory(bid, to, user.Id, reason);
    bid.LastStatusAt = new Date();

    if (to === BidStatus.INTERVIEW) {
      bid.InterviewDate = dto.InterviewDate
        ? new Date(dto.InterviewDate)
        : bid.InterviewDate;
    }
    if (dto.InterviewOutcome) {
      bid.InterviewOutcome = dto.InterviewOutcome;
    }

    if (BID_TERMINAL_STATES.includes(to)) {
      if (
        from === BidStatus.INTERVIEW &&
        !dto.InterviewOutcome &&
        !bid.InterviewOutcome
      ) {
        throw new BadRequestException(
          "Interview outcome is required before terminal state",
        );
      }
      bid.FinalOutcomeTimestamp = new Date();
      if (to === BidStatus.LOST) {
        bid.LossReason = dto.LossReason ?? BidLossReason.OTHER;
        bid.LossReasonOther = dto.LossReasonOther ?? null;
      }
      if (to === BidStatus.WITHDRAWN) {
        bid.WithdrawalReason = dto.WithdrawalReason ?? null;
      }
      if (to === BidStatus.WON) {
        bid.FinalAgreedPrice = dto.FinalAgreedPrice ?? null;
        bid.ExpectedStartDate = dto.ExpectedStartDate
          ? new Date(dto.ExpectedStartDate)
          : null;
        bid.FinalScopeNotes = dto.FinalScopeNotes ?? null;
      }
    }

    return this.bidRepository.save(bid);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const bid = await this.findOne(id, user);
    if (BID_TERMINAL_STATES.includes(bid.CurrentStatus as BidStatus)) {
      throw new BadRequestException("Cannot delete a bid in terminal state");
    }
    await this.bidRepository.remove(bid);
  }

  async bulkDelete(
    ids: string[],
    user: UserEntity,
    orgId?: string | null,
  ): Promise<{ deleted: number; failed: string[] }> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId);
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    const failed: string[] = [];
    let deleted = 0;

    for (const id of ids) {
      try {
        const bid = await this.bidRepository.findOneById(id);
        if (!bid) {
          failed.push(id);
          continue;
        }

        // Check access
        if (bid.OrganizationId !== resolvedOrgId) {
          failed.push(id);
          continue;
        }
        if (ownerOnly && bid.OwnerId !== user.Id) {
          failed.push(id);
          continue;
        }

        // Check terminal state
        if (BID_TERMINAL_STATES.includes(bid.CurrentStatus as BidStatus)) {
          failed.push(id);
          continue;
        }

        await this.bidRepository.remove(bid);
        deleted++;
      } catch (error) {
        failed.push(id);
      }
    }

    return { deleted, failed };
  }

  async getDraftBacklog(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    const thresholds = await this.getThresholds(resolvedOrgId);
    const cutoffDate = new Date(
      Date.now() - thresholds.draftAgingDays * 24 * 60 * 60 * 1000,
    );
    const bids = await this.bidRepository.findAllByOrg(
      resolvedOrgId,
      ownerOnly ? user.Id : undefined,
    );
    const filtered = bids
      .filter(
        (b) => b.CurrentStatus === BidStatus.DRAFT && b.CreatedAt <= cutoffDate,
      )
      .sort((a, b) => a.CreatedAt.getTime() - b.CreatedAt.getTime());
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;
    const items = filtered.slice(skip, skip + take);
    return createPaginatedResponse(items, filtered.length, page, take);
  }

  async getFollowUpBacklog(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    const thresholds = await this.getThresholds(resolvedOrgId);
    const cutoffDate = new Date(
      Date.now() - thresholds.followUpSlaDays * 24 * 60 * 60 * 1000,
    );
    const bids = await this.bidRepository.findAllByOrg(
      resolvedOrgId,
      ownerOnly ? user.Id : undefined,
    );
    const filtered = bids
      .filter((b) =>
        [BidStatus.SUBMITTED, BidStatus.INTERVIEW].includes(
          b.CurrentStatus as BidStatus,
        ),
      )
      .filter((b) => (b.LastStatusAt ?? b.CreatedAt) <= cutoffDate)
      .sort(
        (a, b) =>
          (a.LastStatusAt ?? a.CreatedAt).getTime() -
          (b.LastStatusAt ?? b.CreatedAt).getTime(),
      );
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;
    const items = filtered.slice(skip, skip + take);
    return createPaginatedResponse(items, filtered.length, page, take);
  }

  async getInterviewBacklog(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    const bids = await this.bidRepository.findAllByOrg(
      resolvedOrgId,
      ownerOnly ? user.Id : undefined,
    );
    const filtered = bids
      .filter((b) => b.CurrentStatus === BidStatus.INTERVIEW)
      .sort(
        (a, b) =>
          (a.LastStatusAt ?? a.CreatedAt).getTime() -
          (b.LastStatusAt ?? b.CreatedAt).getTime(),
      );
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;
    const items = filtered.slice(skip, skip + take);
    return createPaginatedResponse(items, filtered.length, page, take);
  }

  async getReviewBacklog(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    const bids = await this.bidRepository.findAllByOrg(
      resolvedOrgId,
      ownerOnly ? user.Id : undefined,
    );
    const filtered = bids.filter((b) => {
      if (b.CurrentStatus === BidStatus.LOST) {
        if (!b.LossReason) return true;
        if (b.LossReason === "other" && !b.LossReasonOther?.trim()) return true;
      }
      if (b.CurrentStatus === BidStatus.WITHDRAWN) {
        if (!b.WithdrawalReason) return true;
      }
      if (b.CurrentStatus === BidStatus.WON) {
        if (b.FinalAgreedPrice == null || !b.ExpectedStartDate) return true;
      }
      return false;
    });
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;
    const items = filtered.slice(skip, skip + take);
    return createPaginatedResponse(items, filtered.length, page, take);
  }

  async getGhostedSuggestions(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);
    const thresholds = await this.getThresholds(resolvedOrgId);
    const cutoffDate = new Date(
      Date.now() - thresholds.ghostedSuggestDays * 24 * 60 * 60 * 1000,
    );
    const bids = await this.bidRepository.findAllByOrg(
      resolvedOrgId,
      ownerOnly ? user.Id : undefined,
    );
    const filtered = bids
      .filter((b) =>
        [BidStatus.SUBMITTED, BidStatus.VIEWED, BidStatus.INTERVIEW].includes(
          b.CurrentStatus as BidStatus,
        ),
      )
      .filter((b) => (b.LastStatusAt ?? b.CreatedAt) <= cutoffDate)
      .sort(
        (a, b) =>
          (a.LastStatusAt ?? a.CreatedAt).getTime() -
          (b.LastStatusAt ?? b.CreatedAt).getTime(),
      );
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;
    const items = filtered.slice(skip, skip + take);
    return createPaginatedResponse(items, filtered.length, page, take);
  }

  async getMetrics(user: UserEntity, orgId: string | null | undefined) {
    try {
      const resolvedOrgId = orgId
        ? await this.resolveOrgId(user, orgId)
        : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
      const ownerOnly = await this.isOwnerOnlyScope(user, resolvedOrgId);

      const bids = await this.bidRepository.findAllByOrg(
        resolvedOrgId,
        ownerOnly ? user.Id : undefined,
      );

      const byStatus = bids.reduce<Record<string, number>>((acc, bid) => {
        const status = bid.CurrentStatus as BidStatus;
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});

      const terminalTotal =
        (byStatus[BidStatus.WON] ?? 0) +
        (byStatus[BidStatus.LOST] ?? 0) +
        (byStatus[BidStatus.GHOSTED] ?? 0) +
        (byStatus[BidStatus.WITHDRAWN] ?? 0);

      const winRate =
        terminalTotal > 0 ? (byStatus[BidStatus.WON] ?? 0) / terminalTotal : 0;

      const now = Date.now();
      const draftBids = bids.filter((b) => b.CurrentStatus === BidStatus.DRAFT);
      const avgDraftAgeDays =
        draftBids.length > 0
          ? draftBids.reduce(
              (sum, b) => sum + (now - b.CreatedAt.getTime()),
              0,
            ) /
            draftBids.length /
            86400000
          : null;

      const wonBidsWithPrice = bids.filter(
        (b) => b.CurrentStatus === BidStatus.WON && b.FinalAgreedPrice != null,
      );
      const avgDealSize =
        wonBidsWithPrice.length > 0
          ? wonBidsWithPrice.reduce(
              (sum, b) => sum + Number(b.FinalAgreedPrice),
              0,
            ) / wonBidsWithPrice.length
          : null;

      const thresholds = await this.getThresholds(resolvedOrgId);
      const followUpCutoff = new Date(
        Date.now() - thresholds.followUpSlaDays * 24 * 60 * 60 * 1000,
      ).getTime();
      const ghostedCutoff = new Date(
        Date.now() - thresholds.ghostedSuggestDays * 24 * 60 * 60 * 1000,
      ).getTime();

      const followUpOverdueCount = bids.filter((b) => {
        const status = b.CurrentStatus as BidStatus;
        if (![BidStatus.SUBMITTED, BidStatus.INTERVIEW].includes(status))
          return false;
        const last = (b.LastStatusAt ?? b.CreatedAt).getTime();
        return last <= followUpCutoff;
      }).length;

      const ghostedSuggestedCount = bids.filter((b) => {
        const status = b.CurrentStatus as BidStatus;
        if (
          ![
            BidStatus.SUBMITTED,
            BidStatus.VIEWED,
            BidStatus.INTERVIEW,
          ].includes(status)
        )
          return false;
        const last = (b.LastStatusAt ?? b.CreatedAt).getTime();
        return last <= ghostedCutoff;
      }).length;

      return {
        byStatus,
        total: bids.length,
        winRate,
        avgDraftAgeDays,
        avgDealSize,
        followUpOverdueCount,
        ghostedSuggestedCount,
      };
    } catch {
      return {
        byStatus: {},
        total: 0,
        winRate: 0,
        avgDraftAgeDays: null,
        avgDealSize: null,
        followUpOverdueCount: 0,
        ghostedSuggestedCount: 0,
      };
    }
  }
}
