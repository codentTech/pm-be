import { Exclude } from 'class-transformer';
import { ROLE } from 'src/common/types/roles.enum';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'Users' })
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  FullName: string;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  Email: string;

  @Exclude() // Exclude password from API responses
  @Column({ type: 'varchar', length: 255, nullable: true })
  Password: string;

  @Column({ type: 'boolean', default: true })
  EmailVerified: boolean;

  @Exclude()
  @Column({ type: 'varchar', length: 64, nullable: true })
  VerificationToken: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  VerificationTokenExpiresAt: Date | null;

  @Exclude()
  @Column({ type: 'varchar', length: 64, nullable: true })
  PasswordResetToken: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  PasswordResetTokenExpiresAt: Date | null;
}
