import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ListEntity } from './list.entity';

@Entity({ name: 'Boards' })
export class BoardEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Name: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  Description: string;

  @OneToMany(() => ListEntity, (list) => list.Board)
  Lists: ListEntity[];
}
