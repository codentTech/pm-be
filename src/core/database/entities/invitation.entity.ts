import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { OrgRole } from 'src/common/types/org-role.enum';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity({ name: 'Invitations' })
export class InvitationEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'OrganizationId' })
  Organization: OrganizationEntity;

  @Column({ type: 'uuid', nullable: false })
  OrganizationId: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Email: string;

  @Column({ type: 'varchar', length: 32, nullable: false, default: OrgRole.DEVELOPER })
  Role: OrgRole;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: false })
  Token: string;

  @Column({ type: 'timestamp', nullable: false })
  ExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  AcceptedAt: Date;
}
