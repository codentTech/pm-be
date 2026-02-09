import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CardEntity } from './card.entity';
import { ChecklistItemEntity } from './checklist-item.entity';

@Entity({ name: 'Checklists' })
export class ChecklistEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => CardEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'CardId' })
  Card: CardEntity;

  @Column({ type: 'uuid', nullable: false })
  CardId: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Title: string;

  @Column({ type: 'int', default: 0 })
  Position: number;

  @OneToMany(() => ChecklistItemEntity, (item) => item.Checklist)
  Items: ChecklistItemEntity[];
}
