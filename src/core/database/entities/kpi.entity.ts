import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum KpiPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity({ name: 'Kpis' })
export class KpiEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Name: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  TargetValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  CurrentValue: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  Unit: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: KpiPeriod.MONTHLY })
  Period: KpiPeriod;

  @Column({ type: 'timestamp', nullable: true })
  DueDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  Notes: string;
}
