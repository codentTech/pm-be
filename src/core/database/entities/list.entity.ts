import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { BoardEntity } from './board.entity';
import { CardEntity } from './card.entity';

@Entity({ name: 'Lists' })
export class ListEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Title: string;

  @Column({ type: 'int', default: 0 })
  Position: number;

  @ManyToOne(() => BoardEntity, (board) => board.Lists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'BoardId' })
  Board: BoardEntity;

  @Column({ type: 'uuid', nullable: false })
  BoardId: string;

  @OneToMany(() => CardEntity, (card) => card.List)
  Cards: CardEntity[];
}
