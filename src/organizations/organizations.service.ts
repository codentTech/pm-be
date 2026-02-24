import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { InvitationRepository } from "src/common/repositories/invitation.repository";
import { OrganizationMemberRepository } from "src/common/repositories/organization-member.repository";
import { OrganizationRepository } from "src/common/repositories/organization.repository";
import { UserRepository } from "src/common/repositories/user.repository";
import { EmailService } from "src/common/services/email.service";
import { OrgRole } from "src/common/types/org-role.enum";
import { ROLE } from "src/common/types/roles.enum";
import { OrganizationEntity } from "src/core/database/entities/organization.entity";
import { UserEntity } from "src/core/database/entities/user.entity";
import {
  CreateOrganizationDto,
  CreateOrganizationWithOwnerDto,
  UpdateOrganizationDto,
  UpdateMemberRoleDto,
} from "./dto/organization.dto";

export interface CreateWithOwnerResult {
  organization: OrganizationEntity;
  invitationSent: boolean;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

@Injectable()
export class OrganizationsService {
  private readonly frontendUrl: string;

  constructor(
    private readonly orgRepository: OrganizationRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly userRepository: UserRepository,
    private readonly invitationRepository: InvitationRepository,
    private readonly emailService: EmailService,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>("FRONTEND_URL") ?? "";
  }

  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  async create(
    dto: CreateOrganizationDto,
    user: UserEntity,
  ): Promise<OrganizationEntity> {
    let slug = dto.Slug?.trim() || slugify(dto.Name);
    if (!slug) slug = "org-" + Date.now();

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
      Role: OrgRole.ORG_ADMIN,
    });
    await this.orgMemberRepository.save(member);

    const orgWithMembers = await this.orgRepository.findById(saved.Id);
    return orgWithMembers!;
  }

  /**
   * Super Admin only: create a workspace and assign the given user (by email) as org admin.
   * If the user exists (verified): add them as org admin.
   * If the user does not exist: create the org and send an invitation; when they sign up and accept, they become org admin.
   */
  async createWithOwner(
    dto: CreateOrganizationWithOwnerDto,
    currentUser: UserEntity,
  ): Promise<CreateWithOwnerResult> {
    const email = dto.OwnerEmail.trim().toLowerCase();
    const owner = await this.userRepository.findOneRecord({
      Email: dto.OwnerEmail.trim(),
    });

    let slug = dto.Slug?.trim() || slugify(dto.Name);
    if (!slug) slug = "org-" + Date.now();

    const existingSlug = await this.orgRepository.findBySlug(slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    if (owner) {
      if (!owner.EmailVerified) {
        throw new BadRequestException(
          `User ${dto.OwnerEmail} must verify their email before they can be set as workspace owner.`,
        );
      }

      const org = this.orgRepository.create({
        Name: dto.Name,
        Slug: slug,
        CreatedBy: owner,
      });
      const saved = await this.orgRepository.save(org);

      const member = this.orgMemberRepository.create({
        Organization: { Id: saved.Id } as OrganizationEntity,
        User: owner,
        Role: OrgRole.ORG_ADMIN,
      });
      await this.orgMemberRepository.save(member);

      const orgWithMembers = await this.orgRepository.findById(saved.Id);
      return { organization: orgWithMembers!, invitationSent: false };
    }

    // User does not exist: create org (no members) and send invitation to become org admin
    const org = this.orgRepository.create({
      Name: dto.Name,
      Slug: slug,
      CreatedBy: currentUser,
    });
    const saved = await this.orgRepository.save(org);

    const existingInvite = await this.invitationRepository.findByEmailAndOrg(
      email,
      saved.Id,
    );
    if (existingInvite && existingInvite.ExpiresAt > new Date()) {
      await this.invitationRepository.remove(existingInvite);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      OrganizationId: saved.Id,
      CreatedBy: currentUser,
      Email: email,
      Role: OrgRole.ORG_ADMIN,
      Token: this.generateInvitationToken(),
      ExpiresAt: expiresAt,
    });
    const savedInvitation = await this.invitationRepository.save(invitation);

    const acceptUrl = `${this.frontendUrl}/invitations?token=${savedInvitation.Token}`;
    await this.emailService.sendInviteMember({
      to: email,
      organizationName: saved.Name,
      inviterName: currentUser.FullName ?? "Super Admin",
      role: "org admin",
      acceptUrl,
    });

    const orgWithRelations = await this.orgRepository.findById(saved.Id);
    return { organization: orgWithRelations!, invitationSent: true };
  }

  /**
   * Super Admin only: list all organizations with org admin and member count.
   */
  async findAllForSuperAdmin(): Promise<
    Array<{
      Id: string;
      Name: string;
      Slug: string;
      CreatedAt: Date;
      MemberCount: number;
      OrgAdminEmail: string | null;
      OrgAdminName: string | null;
    }>
  > {
    const orgs = await this.orgRepository.findAll();
    return orgs.map((org) => {
      const members = org.Members || [];
      const orgAdmin = members.find(
        (m) => (m.Role || "").toLowerCase() === OrgRole.ORG_ADMIN,
      );
      const user = orgAdmin?.User as
        | { Email?: string; FullName?: string }
        | undefined;
      return {
        Id: org.Id,
        Name: org.Name,
        Slug: org.Slug,
        CreatedAt: org.CreatedAt,
        MemberCount: members.length,
        OrgAdminEmail: user?.Email ?? null,
        OrgAdminName: user?.FullName ?? null,
      };
    });
  }

  async findAllForUser(user: UserEntity): Promise<OrganizationEntity[]> {
    const memberships = await this.orgMemberRepository.findOrgsByUserId(
      user.Id,
    );
    const orgIds = memberships.map((m) => m.OrganizationId);
    if (orgIds.length === 0) return [];
    const orgs = await this.orgRepository.findByIds(orgIds);
    return orgs.sort((a, b) => {
      const aRole = memberships.find((m) => m.OrganizationId === a.Id)?.Role;
      const bRole = memberships.find((m) => m.OrganizationId === b.Id)?.Role;
      const order = [
        OrgRole.ORG_ADMIN,
        OrgRole.PROJECT_MANAGER,
        OrgRole.DEVELOPER,
        OrgRole.QUALITY_ASSURANCE_ENGINEER,
        OrgRole.SEO_SPECIALIST,
        OrgRole.BUSINESS_DEVELOPER,
      ];
      return (
        (order.indexOf(aRole as OrgRole) ?? 99) -
        (order.indexOf(bRole as OrgRole) ?? 99)
      );
    });
  }

  async getOrEnsureDefaultOrg(user: UserEntity): Promise<OrganizationEntity> {
    const orgs = await this.findAllForUser(user);
    if (orgs.length > 0) return orgs[0];

    return this.create(
      {
        Name: `${user.FullName}'s Workspace`,
        Slug: `personal-${user.Id.slice(0, 8)}`,
      },
      user,
    );
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    return this.orgRepository.findById(id);
  }

  async findOne(id: string, user: UserEntity): Promise<OrganizationEntity> {
    const org = await this.orgRepository.findById(id);
    if (!org) throw new NotFoundException("Organization not found");

    if (user.SystemRole === ROLE.SUPER_ADMIN) return org;

    const isMember = await this.orgMemberRepository.isMember(user.Id, id);
    if (!isMember)
      throw new ForbiddenException("You are not a member of this organization");
    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    user: UserEntity,
  ): Promise<OrganizationEntity> {
    const org = await this.orgRepository.findById(id);
    if (!org) throw new NotFoundException("Organization not found");

    if (user.SystemRole !== ROLE.SUPER_ADMIN) {
      const hasPermission = await this.orgMemberRepository.hasRole(
        user.Id,
        id,
        [OrgRole.ORG_ADMIN],
      );
      if (!hasPermission)
        throw new ForbiddenException(
          "Only the org admin can update this organization",
        );
    }

    if (dto.Name) org.Name = dto.Name;
    if (dto.LogoUrl !== undefined) org.LogoUrl = dto.LogoUrl;
    if (dto.DraftAgingDays !== undefined)
      org.DraftAgingDays = dto.DraftAgingDays;
    if (dto.FollowUpSlaDays !== undefined)
      org.FollowUpSlaDays = dto.FollowUpSlaDays;
    if (dto.GhostedSuggestDays !== undefined)
      org.GhostedSuggestDays = dto.GhostedSuggestDays;
    if (dto.Slug) {
      const existing = await this.orgRepository.findBySlug(dto.Slug);
      if (existing && existing.Id !== id) {
        throw new BadRequestException("Slug already in use");
      }
      org.Slug = dto.Slug;
    }

    return this.orgRepository.save(org);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const org = await this.orgRepository.findById(id);
    if (!org) throw new NotFoundException("Organization not found");

    if (user.SystemRole !== ROLE.SUPER_ADMIN) {
      const member = await this.orgMemberRepository.findByUserAndOrg(
        user.Id,
        id,
      );
      if (!member || member.Role !== OrgRole.ORG_ADMIN) {
        throw new ForbiddenException(
          "Only the org admin can delete this organization",
        );
      }
    }

    await this.orgRepository.remove(org);
  }

  async getMembers(orgId: string, user: UserEntity): Promise<any[]> {
    if (user.SystemRole !== ROLE.SUPER_ADMIN) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, orgId);
      if (!isMember)
        throw new ForbiddenException(
          "You are not a member of this organization",
        );
    }

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
    const hasPermission = await this.orgMemberRepository.hasRole(
      user.Id,
      orgId,
      [OrgRole.ORG_ADMIN],
    );
    if (!hasPermission)
      throw new ForbiddenException(
        "Only the org admin can update member roles",
      );

    const member = await this.orgMemberRepository.findById(memberId);
    if (!member || member.OrganizationId !== orgId) {
      throw new NotFoundException("Member not found");
    }

    const validRoles = Object.values(OrgRole);
    if (!validRoles.includes(dto.Role as OrgRole)) {
      throw new BadRequestException("Invalid role");
    }

    member.Role = dto.Role as OrgRole;
    await this.orgMemberRepository.save(member);

    return this.getMembers(orgId, user);
  }

  async removeMember(
    orgId: string,
    memberId: string,
    user: UserEntity,
  ): Promise<any> {
    const hasPermission = await this.orgMemberRepository.hasRole(
      user.Id,
      orgId,
      [OrgRole.ORG_ADMIN],
    );
    if (!hasPermission)
      throw new ForbiddenException(
        "Only the org admin can remove members from this organization",
      );

    const member = await this.orgMemberRepository.findById(memberId);
    if (!member || member.OrganizationId !== orgId) {
      throw new NotFoundException("Member not found");
    }

    if (member.Role === OrgRole.ORG_ADMIN) {
      throw new ForbiddenException(
        "Cannot remove the org admin. Transfer the org admin role first or delete the organization.",
      );
    }

    await this.orgMemberRepository.remove(member);
    return this.getMembers(orgId, user);
  }
}
