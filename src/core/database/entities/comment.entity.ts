import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CardEntity } from './card.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'Comments' })
export class CommentEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => CardEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'CardId' })
  Card: CardEntity;

  @Column({ type: 'uuid', nullable: false })
  CardId: string;

  @Index()
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  User: UserEntity;

  @Column({ type: 'uuid', nullable: false })
  UserId: string;

  @Column({ type: 'varchar', length: 4000, nullable: false })
  Content: string;

  @Index()
  @ManyToOne(() => CommentEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'ParentId' })
  Parent: CommentEntity | null;

  @Column({ type: 'uuid', nullable: true })
  ParentId: string | null;
}
