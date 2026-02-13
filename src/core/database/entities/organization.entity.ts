import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationMemberEntity } from './organization-member.entity';

@Entity({ name: 'Organizations' })
export class OrganizationEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  Slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  LogoUrl: string;

  @Column({ type: 'int', default: 7 })
  DraftAgingDays: number;

  @Column({ type: 'int', default: 3 })
  FollowUpSlaDays: number;

  @Column({ type: 'int', default: 14 })
  GhostedSuggestDays: number;

  @OneToMany(() => OrganizationMemberEntity, (member) => member.Organization)
  Members: OrganizationMemberEntity[];
}
