import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProjectEntity } from './project.entity';
import { SprintStatus } from 'src/common/types/sprint-status.enum';

@Entity({ name: 'Sprints' })
export class SprintEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Name: string;

  @Column({ type: 'date', nullable: false })
  StartDate: Date;

  @Column({ type: 'date', nullable: false })
  EndDate: Date;

  @Column({ type: 'text', nullable: true })
  Goal: string | null;

  @Column({ type: 'jsonb', nullable: true })
  CapacitySnapshot: Record<string, number> | null;

  @Column({ type: 'enum', enum: SprintStatus, default: SprintStatus.PLANNED })
  Status: SprintStatus;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProjectId' })
  Project: ProjectEntity;

  @Column({ type: 'uuid', nullable: false })
  ProjectId: string;
}
