import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { KpiPeriod } from 'src/common/types/kpi-period.enum';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity({ name: 'Kpis' })
export class KpiEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'OrganizationId' })
  Organization: OrganizationEntity;

  @Column({ type: 'uuid', nullable: true })
  OrganizationId: string | null;

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
