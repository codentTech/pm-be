import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ListEntity } from './list.entity';
import { OrganizationEntity } from './organization.entity';

@Entity({ name: 'Boards' })
export class BoardEntity extends BaseEntity {
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

  @OneToMany(() => ListEntity, (list) => list.Board)
  Lists: ListEntity[];
}
