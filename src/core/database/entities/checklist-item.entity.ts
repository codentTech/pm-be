import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ChecklistEntity } from './checklist.entity';

@Entity({ name: 'ChecklistItems' })
export class ChecklistItemEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => ChecklistEntity, (checklist) => checklist.Items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ChecklistId' })
  Checklist: ChecklistEntity;

  @Column({ type: 'uuid', nullable: false })
  ChecklistId: string;

  @Index()
  @Column({ type: 'varchar', length: 500, nullable: false })
  Title: string;

  @Column({ type: 'boolean', default: false })
  IsCompleted: boolean;

  @Column({ type: 'int', default: 0 })
  Position: number;
}
