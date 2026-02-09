import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { NotificationType } from 'src/common/types/notification-type.enum';

@Entity({ name: 'Notifications' })
export class NotificationEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  User: UserEntity;

  @Column({ type: 'uuid', nullable: false })
  UserId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  Type: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  Title: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  Body: string;

  @Column({ type: 'jsonb', nullable: true })
  Data: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  IsRead: boolean;
}
