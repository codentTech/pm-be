import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ListEntity } from './list.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { SprintEntity } from './sprint.entity';
import { ProjectDeliveryType } from 'src/common/types/project-delivery-type.enum';
import { ProjectRiskLevel } from 'src/common/types/project-risk-level.enum';
import { ProjectStatus } from 'src/common/types/project-status.enum';

@Entity({ name: 'Projects' })
export class ProjectEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'OrganizationId' })
  Organization: OrganizationEntity;

  @Column({ type: 'uuid', nullable: true })
  OrganizationId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Name: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  Description: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  BidId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ClientDisplayName: string | null;

  @Index()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'ProjectOwnerId' })
  ProjectOwner: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  ProjectOwnerId: string | null;

  @Column({ type: 'date', nullable: true })
  StartDate: Date | null;

  @Column({
    type: 'enum',
    enum: ProjectDeliveryType,
    default: ProjectDeliveryType.TIME_AND_MATERIAL,
  })
  DeliveryType: ProjectDeliveryType;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.CREATED })
  Status: ProjectStatus;

  @Column({ type: 'enum', enum: ProjectRiskLevel, nullable: true })
  RiskLevel: ProjectRiskLevel | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ExternalReferenceId: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  Budget: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  FinalAgreedPrice: number | null;

  @Column({ type: 'date', nullable: true })
  ExpectedStartDate: Date | null;

  @Column({ type: 'text', nullable: true })
  FinalScopeNotes: string | null;

  @OneToMany(() => ListEntity, (list) => list.Project)
  Lists: ListEntity[];

  @OneToMany(() => SprintEntity, (sprint) => sprint.Project)
  Sprints: SprintEntity[];
}
