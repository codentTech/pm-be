import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CardEntity } from './card.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'CardAssignees' })
export class CardAssigneeEntity {
  @PrimaryColumn({ type: 'uuid' })
  CardId: string;

  @PrimaryColumn({ type: 'uuid' })
  UserId: string;

  @Index()
  @ManyToOne(() => CardEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'CardId' })
  Card: CardEntity;

  @Index()
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  User: UserEntity;
}
