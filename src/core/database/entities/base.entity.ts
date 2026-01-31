import {
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export class BaseEntity {
  @Index()
  @PrimaryGeneratedColumn('uuid')
  Id: string;

  @Index()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'CreatedBy' })
  CreatedBy: UserEntity;

  @Index()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'DeletedBy' })
  DeletedBy: UserEntity;

  @Index()
  @CreateDateColumn({ type: 'timestamp' })
  CreatedAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  UpdatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  DeletedAt: Date;
}
