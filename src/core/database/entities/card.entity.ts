import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AttachmentEntity } from './attachment.entity';
import { BaseEntity } from './base.entity';
import { CardAssigneeEntity } from './card-assignee.entity';
import { CardLabelEntity } from './card-label.entity';
import { ChecklistEntity } from './checklist.entity';
import { CommentEntity } from './comment.entity';
import { ListEntity } from './list.entity';

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
