import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AttachmentEntity } from './attachment.entity';
import { BaseEntity } from './base.entity';
import { CardAssigneeEntity } from './card-assignee.entity';
import { CardLabelEntity } from './card-label.entity';
import { ChecklistEntity } from './checklist.entity';
import { CommentEntity } from './comment.entity';
import { ListEntity } from './list.entity';
import { UserEntity } from './user.entity';
import { TicketPriority } from 'src/common/types/ticket-priority.enum';
import { TicketSeverity } from 'src/common/types/ticket-severity.enum';
import { TicketStatus } from 'src/common/types/ticket-status.enum';
import { TicketType } from 'src/common/types/ticket-type.enum';
import { TicketStatusHistoryEntry } from 'src/common/types/ticket-status-history.interface';

@Entity({ name: 'Cards' })
export class CardEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Title: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  Description: string;

  @Column({ type: 'int', default: 0 })
  Position: number;

  @Column({ type: 'timestamp', nullable: true })
  DueDate: Date;

  @Column({ type: 'enum', enum: TicketType, default: TicketType.TASK })
  TicketType: TicketType;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.P2 })
  Priority: TicketPriority;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.BACKLOG })
  Status: TicketStatus;

  @Index()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'ReporterId' })
  Reporter: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  ReporterId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  EstimateHours: number | null;

  @Column({ type: 'uuid', nullable: true })
  SprintId: string | null;

  @Column({ type: 'uuid', nullable: true })
  ParentEpicId: string | null;

  @Column({ type: 'text', nullable: true })
  BlockedReason: string | null;

  @Column({ type: 'text', nullable: true })
  AcceptanceCriteria: string | null;

  @Column({ type: 'enum', enum: TicketSeverity, nullable: true })
  Severity: TicketSeverity | null;

  @Column({ type: 'jsonb', nullable: true })
  StatusHistory: TicketStatusHistoryEntry[] | null;

  @Column({ type: 'int', default: 0 })
  ReopenCount: number;

  @Column({ type: 'text', nullable: true })
  ValidationNotes: string | null;

  @ManyToOne(() => ListEntity, (list) => list.Cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ListId' })
  List: ListEntity;

  @Column({ type: 'uuid', nullable: false })
  ListId: string;

  @OneToMany(() => CardLabelEntity, (cl) => cl.Card)
  CardLabels?: CardLabelEntity[];

  @OneToMany(() => CardAssigneeEntity, (ca) => ca.Card)
  CardAssignees?: CardAssigneeEntity[];

  @OneToMany(() => AttachmentEntity, (a) => a.Card)
  Attachments?: AttachmentEntity[];

  @OneToMany(() => CommentEntity, (c) => c.Card)
  Comments?: CommentEntity[];

  @OneToMany(() => ChecklistEntity, (ch) => ch.Card)
  Checklists?: ChecklistEntity[];
}
