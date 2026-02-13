import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { DailyUpdateEntity } from './daily-update.entity';
import { WorkItemStatus } from 'src/common/types/work-item-status.enum';
import { BlockerType } from 'src/common/types/blocker-type.enum';

@Entity({ name: 'DailyUpdateWorkItems' })
export class DailyUpdateWorkItemEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => DailyUpdateEntity, (update) => update.WorkItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'DailyUpdateId' })
  DailyUpdate: DailyUpdateEntity;

  @Column({ type: 'uuid', nullable: false })
  DailyUpdateId: string;

  @Column({ type: 'uuid', nullable: false })
  OrganizationId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  Type: string;

  @Column({ type: 'uuid', nullable: true })
  ReferenceId: string | null;

  @Column({ type: 'text', nullable: false })
  Description: string;

  @Column({ type: 'enum', enum: WorkItemStatus, nullable: false })
  Status: WorkItemStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  TimeSpent: number | null;

  @Column({ type: 'enum', enum: BlockerType, nullable: true })
  BlockerType: BlockerType | null;

  @Column({ type: 'text', nullable: true })
  BlockerReason: string | null;

  @Column({ type: 'date', nullable: true })
  ExpectedResolutionDate: Date | null;

  @Column({ type: 'text', nullable: true })
  Comments: string | null;
}
