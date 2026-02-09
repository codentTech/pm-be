import { Injectable } from '@nestjs/common';
import { OrgRole } from 'src/common/types/org-role.enum';
import { OrganizationMemberEntity } from 'src/core/database/entities/organization-member.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrganizationMemberRepository extends BaseRepository<OrganizationMemberEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, OrganizationMemberEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findById(id: string): Promise<OrganizationMemberEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: ['Organization', 'User'],
    });
  }

  async findByUserAndOrg(userId: string, orgId: string): Promise<OrganizationMemberEntity | null> {
    return this.repo.findOne({
      where: { UserId: userId, OrganizationId: orgId },
      relations: ['Organization', 'User'],
    });
  }

  async findOrgsByUserId(userId: string): Promise<OrganizationMemberEntity[]> {
    return this.repo.find({
      where: { UserId: userId },
      relations: ['Organization'],
      order: { Role: 'ASC' }, // Owner first
    });
  }

  async findMembersByOrgId(orgId: string): Promise<OrganizationMemberEntity[]> {
    return this.repo.find({
      where: { OrganizationId: orgId },
      relations: ['User'],
    });
  }

  async isMember(userId: string, orgId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { UserId: userId, OrganizationId: orgId },
    });
    return count > 0;
  }

  async hasRole(userId: string, orgId: string, roles: OrgRole[]): Promise<boolean> {
    const member = await this.findByUserAndOrg(userId, orgId);
    return member ? roles.includes(member.Role as OrgRole) : false;
  }

  create(data: Partial<OrganizationMemberEntity>): OrganizationMemberEntity {
    return this.repo.create(data);
  }

  async save(entity: OrganizationMemberEntity): Promise<OrganizationMemberEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: OrganizationMemberEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
