import { Injectable } from '@nestjs/common';
import { BidEntity } from 'src/core/database/entities/bid.entity';
import { BidStatus } from 'src/common/types/bid-status.enum';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class BidRepository extends BaseRepository<BidEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, BidEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findAllByOrg(orgId: string, ownerId?: string): Promise<BidEntity[]> {
    const where: Record<string, unknown> = { OrganizationId: orgId };
    if (ownerId) where.OwnerId = ownerId;
    return this.repo.find({
      where,
      relations: ['Owner', 'CreatedBy'],
      order: { CreatedAt: 'DESC' },
    });
  }

  async findAllByOrgPaginated(
    orgId: string,
    skip: number,
    take: number,
    sort = 'CreatedAt',
    order: 'ASC' | 'DESC' = 'DESC',
    status?: BidStatus,
    ownerId?: string,
  ): Promise<[BidEntity[], number]> {
    const orderOpt: Record<string, 'ASC' | 'DESC'> = {};
    const validSort = [
      'CreatedAt',
      'UpdatedAt',
      'SubmissionDate',
      'CurrentStatus',
      'ClientDisplayName',
      'BidTitle',
      'ProposedPrice',
    ].includes(sort)
      ? sort
      : 'CreatedAt';
    orderOpt[validSort] = order;

    const where: Record<string, unknown> = { OrganizationId: orgId };
    if (status) where.CurrentStatus = status;
    if (ownerId) where.OwnerId = ownerId;

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['Owner', 'CreatedBy'],
      order: orderOpt,
      skip,
      take,
    });
    return [items, total];
  }

  async findOneById(id: string): Promise<BidEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: ['Owner', 'CreatedBy', 'Organization'],
    });
  }

  async findOneByIdAndOrg(id: string, orgId: string): Promise<BidEntity | null> {
    return this.repo.findOne({
      where: { Id: id, OrganizationId: orgId },
      relations: ['Owner', 'CreatedBy', 'Organization'],
    });
  }

  create(data: Partial<BidEntity>): BidEntity {
    return this.repo.create(data);
  }

  async save(entity: BidEntity): Promise<BidEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: BidEntity): Promise<void> {
    await this.repo.remove(entity);
  }

  private baseOrgQuery(orgId: string, ownerId?: string) {
    const qb = this.repo
      .createQueryBuilder('bids')
      .leftJoinAndSelect('bids.Owner', 'owner')
      .leftJoinAndSelect('bids.CreatedBy', 'createdBy')
      .where('bids."OrganizationId" = :orgId', { orgId });
    if (ownerId) qb.andWhere('bids."OwnerId" = :ownerId', { ownerId });
    return qb;
  }

  async findDraftBacklog(
    orgId: string,
    ownerId: string | undefined,
    cutoffDate: Date,
    skip: number,
    take: number,
  ): Promise<[BidEntity[], number]> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .andWhere('bids."CurrentStatus" = :status', { status: BidStatus.DRAFT })
      .andWhere('bids."CreatedAt" <= :cutoffDate', { cutoffDate })
      .orderBy('bids."CreatedAt"', 'ASC')
      .skip(skip)
      .take(take);
    return qb.getManyAndCount();
  }

  async findFollowUpBacklog(
    orgId: string,
    ownerId: string | undefined,
    cutoffDate: Date,
    skip: number,
    take: number,
  ): Promise<[BidEntity[], number]> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .andWhere('bids."CurrentStatus" IN (:...statuses)', {
        statuses: [BidStatus.SUBMITTED, BidStatus.INTERVIEW],
      })
      .andWhere('COALESCE(bids."LastStatusAt", bids."CreatedAt") <= :cutoffDate', {
        cutoffDate,
      })
      .orderBy('bids."LastStatusAt"', 'ASC')
      .skip(skip)
      .take(take);
    return qb.getManyAndCount();
  }

  async findInterviewBacklog(
    orgId: string,
    ownerId: string | undefined,
    skip: number,
    take: number,
  ): Promise<[BidEntity[], number]> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .andWhere('bids."CurrentStatus" = :status', { status: BidStatus.INTERVIEW })
      .orderBy('bids."LastStatusAt"', 'ASC')
      .skip(skip)
      .take(take);
    return qb.getManyAndCount();
  }

  async findReviewBacklog(
    orgId: string,
    ownerId: string | undefined,
    skip: number,
    take: number,
  ): Promise<[BidEntity[], number]> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .andWhere(
        `
        (
          bids."CurrentStatus" = :lostStatus AND (
            bids."LossReason" IS NULL OR (
              bids."LossReason" = :lossOther AND (bids."LossReasonOther" IS NULL OR bids."LossReasonOther" = '')
            )
          )
        )
        OR (
          bids."CurrentStatus" = :withdrawnStatus AND bids."WithdrawalReason" IS NULL
        )
        OR (
          bids."CurrentStatus" = :wonStatus AND (bids."FinalAgreedPrice" IS NULL OR bids."ExpectedStartDate" IS NULL)
        )
        `,
        {
          lostStatus: BidStatus.LOST,
          lossOther: 'other',
          withdrawnStatus: BidStatus.WITHDRAWN,
          wonStatus: BidStatus.WON,
        },
      )
      .orderBy('bids."UpdatedAt"', 'DESC')
      .skip(skip)
      .take(take);
    return qb.getManyAndCount();
  }

  async findGhostedSuggestions(
    orgId: string,
    ownerId: string | undefined,
    cutoffDate: Date,
    skip: number,
    take: number,
  ): Promise<[BidEntity[], number]> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .andWhere('bids."CurrentStatus" IN (:...statuses)', {
        statuses: [BidStatus.SUBMITTED, BidStatus.VIEWED, BidStatus.INTERVIEW],
      })
      .andWhere('COALESCE(bids."LastStatusAt", bids."CreatedAt") <= :cutoffDate', {
        cutoffDate,
      })
      .orderBy('bids."LastStatusAt"', 'ASC')
      .skip(skip)
      .take(take);
    return qb.getManyAndCount();
  }

  async getStatusCounts(
    orgId: string,
    ownerId?: string,
  ): Promise<{ status: BidStatus; count: number }[]> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .select('bids."CurrentStatus"', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('bids."CurrentStatus"');
    const rows = await qb.getRawMany<{ status: BidStatus; count: string }>();
    return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
  }

  async getAverageDraftAgeDays(orgId: string, ownerId?: string): Promise<number | null> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .select('AVG(EXTRACT(EPOCH FROM (NOW() - bids."CreatedAt")))', 'avgSeconds')
      .andWhere('bids."CurrentStatus" = :status', { status: BidStatus.DRAFT });
    const row = await qb.getRawOne<{ avgSeconds: string | null }>();
    if (!row?.avgSeconds) return null;
    return Number(row.avgSeconds) / 86400;
  }

  async getAverageWonDealSize(orgId: string, ownerId?: string): Promise<number | null> {
    const qb = this.baseOrgQuery(orgId, ownerId)
      .select('AVG(bids."FinalAgreedPrice")', 'avgPrice')
      .andWhere('bids."CurrentStatus" = :status', { status: BidStatus.WON })
      .andWhere('bids."FinalAgreedPrice" IS NOT NULL');
    const row = await qb.getRawOne<{ avgPrice: string | null }>();
    if (!row?.avgPrice) return null;
    return Number(row.avgPrice);
  }
}
