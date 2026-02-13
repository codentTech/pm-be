import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { OrganizationRepository } from 'src/common/repositories/organization.repository';
import { OrgRole } from 'src/common/types/org-role.enum';
import { OrganizationEntity } from 'src/core/database/entities/organization.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CreateOrganizationDto, UpdateOrganizationDto, UpdateMemberRoleDto } from './dto/organization.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly orgRepository: OrganizationRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  async create(dto: CreateOrganizationDto, user: UserEntity): Promise<OrganizationEntity> {
    let slug = dto.Slug?.trim() || slugify(dto.Name);
    if (!slug) slug = 'org-' + Date.now();

    const existing = await this.orgRepository.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const org = this.orgRepository.create({
      Name: dto.Name,
      Slug: slug,
      LogoUrl: dto.LogoUrl,
      CreatedBy: user,
    });
    const saved = await this.orgRepository.save(org);

    const member = this.orgMemberRepository.create({
      Organization: { Id: saved.Id } as OrganizationEntity,
      User: user,
      Role: OrgRole.OWNER,
    });
    await this.orgMemberRepository.save(member);

    const orgWithMembers = await this.orgRepository.findById(saved.Id);
    return orgWithMembers!;
  }

  async findAllForUser(user: UserEntity): Promise<OrganizationEntity[]> {
    const memberships = await this.orgMemberRepository.findOrgsByUserId(user.Id);
    const orgIds = memberships.map((m) => m.OrganizationId);
    if (orgIds.length === 0) return [];
    const orgs = await this.orgRepository.findByIds(orgIds);
    return orgs.sort((a, b) => {
      const aRole = memberships.find((m) => m.OrganizationId === a.Id)?.Role;
      const bRole = memberships.find((m) => m.OrganizationId === b.Id)?.Role;
      const order = [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.GUEST];
      return (order.indexOf(aRole as OrgRole) ?? 99) - (order.indexOf(bRole as OrgRole) ?? 99);
    });
  }

  async getOrEnsureDefaultOrg(user: UserEntity): Promise<OrganizationEntity> {
    const orgs = await this.findAllForUser(user);
    if (orgs.length > 0) return orgs[0];

    return this.create(
      { Name: `${user.FullName}'s Workspace`, Slug: `personal-${user.Id.slice(0, 8)}` },
      user,
    );
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    return this.orgRepository.findById(id);
  }

  async findOne(id: string, user: UserEntity): Promise<OrganizationEntity> {
    const isMember = await this.orgMemberRepository.isMember(user.Id, id);
    if (!isMember) throw new ForbiddenException('You are not a member of this organization');

    const org = await this.orgRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    user: UserEntity,
  ): Promise<OrganizationEntity> {
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, id, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);
    if (!hasPermission) throw new ForbiddenException('You cannot update this organization');

    const org = await this.orgRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    if (dto.Name) org.Name = dto.Name;
    if (dto.LogoUrl !== undefined) org.LogoUrl = dto.LogoUrl;
    if (dto.DraftAgingDays !== undefined) org.DraftAgingDays = dto.DraftAgingDays;
    if (dto.FollowUpSlaDays !== undefined) org.FollowUpSlaDays = dto.FollowUpSlaDays;
    if (dto.GhostedSuggestDays !== undefined) org.GhostedSuggestDays = dto.GhostedSuggestDays;
    if (dto.Slug) {
      const existing = await this.orgRepository.findBySlug(dto.Slug);
      if (existing && existing.Id !== id) {
        throw new BadRequestException('Slug already in use');
      }
      org.Slug = dto.Slug;
    }

    return this.orgRepository.save(org);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const member = await this.orgMemberRepository.findByUserAndOrg(user.Id, id);
    if (!member || member.Role !== OrgRole.OWNER) {
      throw new ForbiddenException('Only the owner can delete this organization');
    }

    const org = await this.orgRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    await this.orgRepository.remove(org);
  }

  async getMembers(orgId: string, user: UserEntity): Promise<any[]> {
    const isMember = await this.orgMemberRepository.isMember(user.Id, orgId);
    if (!isMember) throw new ForbiddenException('You are not a member of this organization');

    const members = await this.orgMemberRepository.findMembersByOrgId(orgId);
    return members.map((m) => ({
      Id: m.Id,
      UserId: m.UserId,
      Role: m.Role,
      CreatedAt: m.CreatedAt,
      UpdatedAt: m.UpdatedAt,
      User: m.User
        ? {
            Id: m.User.Id,
            FullName: m.User.FullName,
            Email: m.User.Email,
          }
        : null,
    }));
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    user: UserEntity,
  ): Promise<any> {
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, orgId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);
    if (!hasPermission) throw new ForbiddenException('You cannot update members in this organization');

    const member = await this.orgMemberRepository.findById(memberId);
    if (!member || member.OrganizationId !== orgId) {
      throw new NotFoundException('Member not found');
    }

    const requesterMember = await this.orgMemberRepository.findByUserAndOrg(user.Id, orgId);
    if (requesterMember?.Role === OrgRole.ADMIN && member.Role === OrgRole.OWNER) {
      throw new ForbiddenException('Admins cannot change the owner role');
    }
    if (requesterMember?.Role === OrgRole.ADMIN && member.Role === OrgRole.ADMIN) {
      throw new ForbiddenException('Admins cannot change other admins');
    }
    if (member.Role === OrgRole.OWNER && dto.Role !== OrgRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    const validRoles = [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.GUEST];
    if (!validRoles.includes(dto.Role as OrgRole)) {
      throw new BadRequestException('Invalid role');
    }

    member.Role = dto.Role as OrgRole;
    await this.orgMemberRepository.save(member);

    return this.getMembers(orgId, user);
  }

  async removeMember(orgId: string, memberId: string, user: UserEntity): Promise<any> {
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, orgId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);
    if (!hasPermission) throw new ForbiddenException('You cannot remove members from this organization');

    const member = await this.orgMemberRepository.findById(memberId);
    if (!member || member.OrganizationId !== orgId) {
      throw new NotFoundException('Member not found');
    }

    if (member.Role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove the owner from the organization');
    }

    const requesterMember = await this.orgMemberRepository.findByUserAndOrg(user.Id, orgId);
    if (requesterMember?.Role === OrgRole.ADMIN && member.Role === OrgRole.ADMIN) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.orgMemberRepository.remove(member);
    return this.getMembers(orgId, user);
  }
}
