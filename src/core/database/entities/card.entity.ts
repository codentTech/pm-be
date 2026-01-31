import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
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
}
