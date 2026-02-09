import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity({ name: 'Labels' })
export class LabelEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'OrganizationId' })
  Organization: OrganizationEntity;

  @Column({ type: 'uuid', nullable: false })
  OrganizationId: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: false })
  Name: string;

  @Column({ type: 'varchar', length: 7, nullable: false, default: '#6b7280' })
  Color: string;
}
