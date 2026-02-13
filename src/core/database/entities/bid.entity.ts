import { BidPlatform } from "src/common/types/bid-platform.enum";
import { BidStatus } from "src/common/types/bid-status.enum";
import { BidStatusHistoryEntry } from "src/common/types/bid-status-history.interface";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { OrganizationEntity } from "./organization.entity";
import { UserEntity } from "./user.entity";

@Index("IDX_Bid_Platform_JobRef_Unique", ["OrganizationId", "Platform", "JobUrlOrReference"], {
  unique: true,
})
@Entity({ name: "Bids" })
export class BidEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => OrganizationEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "OrganizationId" })
  Organization: OrganizationEntity;

  @Column({ type: "uuid", nullable: true })
  OrganizationId: string | null;

  @Index()
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "OwnerId" })
  Owner: UserEntity;

  @Column({ type: "uuid", nullable: false })
  OwnerId: string;

  @Index()
  @Column({ type: "varchar", length: 50, nullable: false })
  Platform: BidPlatform;

  @Index()
  @Column({ type: "varchar", length: 500, nullable: false })
  JobUrlOrReference: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  ClientDisplayName: string;

  @Column({ type: "varchar", length: 500, nullable: false })
  BidTitle: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  ClientBudget: string | null;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: false })
  ProposedPrice: number;

  @Column({ type: "varchar", length: 3, nullable: false, default: "USD" })
  Currency: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  EstimatedEffort: number;

  @Column({ type: "jsonb", nullable: true, default: [] })
  SkillsTags: string[];

  @Column({ type: "date", nullable: false })
  SubmissionDate: Date;

  @Index()
  @Column({ type: "varchar", length: 50, nullable: false })
  CurrentStatus: BidStatus;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  Probability: number | null;

  @Column({ type: "text", nullable: true })
  CompetitorNotes: string | null;

  @Column({ type: "text", nullable: true })
  RiskFlags: string | null;

  @Column({ type: "text", nullable: true })
  InternalComments: string | null;

  @Column({ type: "jsonb", nullable: true, default: [] })
  StatusHistory: BidStatusHistoryEntry[];

  @Column({ type: "timestamp", nullable: true })
  LastStatusAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  FinalOutcomeTimestamp: Date | null;

  @Column({ type: "timestamp", nullable: true })
  InterviewDate: Date | null;

  @Column({ type: "text", nullable: true })
  InterviewOutcome: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  LossReason: string | null;

  @Column({ type: "text", nullable: true })
  LossReasonOther: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  WithdrawalReason: string | null;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  FinalAgreedPrice: number | null;

  @Column({ type: "date", nullable: true })
  ExpectedStartDate: Date | null;

  @Column({ type: "text", nullable: true })
  FinalScopeNotes: string | null;
}
