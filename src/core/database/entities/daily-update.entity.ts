import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { DailyUpdateRole } from 'src/common/types/daily-update-role.enum';
import { DailyUpdateStatus } from 'src/common/types/daily-update-status.enum';
import { DailyUpdateWorkItemEntity } from './daily-update-work-item.entity';

@Entity({ name: 'DailyUpdates' })
@Index(['OrganizationId', 'UserId', 'Date'], { unique: true })
export class DailyUpdateEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'OrganizationId' })
  Organization: OrganizationEntity;

  @Column({ type: 'uuid', nullable: true })
  OrganizationId: string | null;

  @Index()
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'UserId' })
  User: UserEntity;

  @Column({ type: 'uuid', nullable: false })
  UserId: string;

  @Index()
  @Column({ type: 'date', nullable: false })
  Date: Date;

  @Column({ type: 'enum', enum: DailyUpdateRole, nullable: false })
  Role: DailyUpdateRole;

  @Column({ type: 'enum', enum: DailyUpdateStatus, nullable: false })
  OverallStatus: DailyUpdateStatus;

  @Column({ type: 'timestamp', nullable: false })
  SubmittedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  TotalTimeSpent: number | null;

  @Column({ type: 'text', nullable: true })
  Notes: string | null;

  @Column({ type: 'text', nullable: true })
  NextDayPlan: string | null;

  @OneToMany(() => DailyUpdateWorkItemEntity, (item) => item.DailyUpdate, {
    cascade: true,
  })
  WorkItems: DailyUpdateWorkItemEntity[];
}
