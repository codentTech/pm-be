import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProjectEntity } from './project.entity';
import { CardEntity } from './card.entity';

@Entity({ name: 'Lists' })
export class ListEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Title: string;

  @Column({ type: 'int', default: 0 })
  Position: number;

  @ManyToOne(() => ProjectEntity, (project) => project.Lists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProjectId' })
  Project: ProjectEntity;

  @Column({ type: 'uuid', nullable: false })
  ProjectId: string;

  @OneToMany(() => CardEntity, (card) => card.List)
  Cards: CardEntity[];
}
