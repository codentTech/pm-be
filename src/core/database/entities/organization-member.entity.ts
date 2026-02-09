import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { OrgRole } from 'src/common/types/org-role.enum';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'OrganizationMembers' })
@Unique(['OrganizationId', 'UserId'])
export class OrganizationMemberEntity extends BaseEntity {

  @Index()
  @ManyToOne(() => OrganizationEntity, (org) => org.Members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'OrganizationId' })
  Organization: OrganizationEntity;

  @Column({ type: 'uuid', nullable: false })
  OrganizationId: string;

  @Index()
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  User: UserEntity;

  @Column({ type: 'uuid', nullable: false })
  UserId: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: OrgRole.MEMBER })
  Role: OrgRole;
}
