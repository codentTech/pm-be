import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/common/repositories/user.repository';
import { InvitationRepository } from 'src/common/repositories/invitation.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { OrganizationRepository } from 'src/common/repositories/organization.repository';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { EmailService } from 'src/common/services/email.service';
import { OrgRole } from 'src/common/types/org-role.enum';
import { InvitationEntity } from 'src/core/database/entities/invitation.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CreateInvitationDto } from './dto/invitation.dto';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  private readonly frontendUrl: string;

  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly userRepository: UserRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly emailService: EmailService,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async getPreview(token: string): Promise<{
    organizationName: string;
    inviterName: string;
    role: string;
    expiresAt: Date;
    email: string;
  } | null> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) return null;
    if (invitation.AcceptedAt) return null;
    if (invitation.ExpiresAt < new Date()) return null;

    const org = await this.organizationsService.findById(invitation.OrganizationId);
    const inviter = invitation.CreatedBy;
    return {
      organizationName: org?.Name ?? 'Unknown',
      inviterName: inviter?.FullName ?? 'Someone',
      role: invitation.Role,
      expiresAt: invitation.ExpiresAt,
      email: invitation.Email,
    };
  }

  async create(orgId: string, dto: CreateInvitationDto, user: UserEntity): Promise<InvitationEntity> {
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, orgId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);
    if (!hasPermission) throw new ForbiddenException('You cannot invite to this organization');

    const org = await this.organizationsService.findOne(orgId, user);
    const email = dto.Email.toLowerCase().trim();

    const existingUser = await this.userRepository
      .getORMMethods()
      .createQueryBuilder('u')
      .where('LOWER(u.Email) = :email', { email })
      .getOne();
    if (existingUser) {
      const isMember = await this.orgMemberRepository.isMember(existingUser.Id, orgId);
      if (isMember) throw new BadRequestException('User is already a member');
    }

    const existingInvite = await this.invitationRepository.findByEmailAndOrg(email, orgId);
    if (existingInvite) {
      if (existingInvite.ExpiresAt > new Date()) {
        throw new BadRequestException('Invitation already sent to this email');
      }
      await this.invitationRepository.remove(existingInvite);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      OrganizationId: orgId,
      CreatedBy: user,
      Email: email,
      Role: dto.Role,
      Token: this.generateToken(),
      ExpiresAt: expiresAt,
    });
    const saved = await this.invitationRepository.save(invitation);

    const acceptUrl = `${this.frontendUrl}/invitations?token=${saved.Token}`;
    await this.emailService.sendInviteMember({
      to: email,
      organizationName: org.Name,
      inviterName: user.FullName,
      role: dto.Role,
      acceptUrl,
    });

    return saved;
  }

  async findPendingByOrg(orgId: string, user: UserEntity): Promise<InvitationEntity[]> {
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, orgId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);
    if (!hasPermission) throw new ForbiddenException('You cannot view invitations');

    return this.invitationRepository.findPendingByOrg(orgId);
  }

  async findPendingForUser(user: UserEntity): Promise<InvitationEntity[]> {
    return this.invitationRepository.findPendingByEmail(user.Email.toLowerCase());
  }

  async accept(token: string, user: UserEntity): Promise<void> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.AcceptedAt) throw new BadRequestException('Invitation already accepted');
    if (invitation.ExpiresAt < new Date()) throw new BadRequestException('Invitation has expired');

    const userEmail = user.Email.toLowerCase();
    if (userEmail !== invitation.Email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email');
    }

    const existingMember = await this.orgMemberRepository.findByUserAndOrg(
      user.Id,
      invitation.OrganizationId,
    );
    if (existingMember) throw new BadRequestException('You are already a member');

    const member = this.orgMemberRepository.create({
      OrganizationId: invitation.OrganizationId,
      UserId: user.Id,
      Role: invitation.Role as OrgRole,
    });
    await this.orgMemberRepository.save(member);

    invitation.AcceptedAt = new Date();
    await this.invitationRepository.save(invitation);
  }

  async decline(token: string, user: UserEntity): Promise<void> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.AcceptedAt) throw new BadRequestException('Invitation already accepted');

    const userEmail = user.Email.toLowerCase();
    if (userEmail !== invitation.Email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email');
    }

    await this.invitationRepository.remove(invitation);
  }

  async cancel(invitationId: string, orgId: string, user: UserEntity): Promise<void> {
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, orgId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);
    if (!hasPermission) throw new ForbiddenException('You cannot cancel invitations');

    const invitations = await this.invitationRepository.findPendingByOrg(orgId);
    const invitation = invitations.find((i) => i.Id === invitationId);
    if (!invitation) throw new NotFoundException('Invitation not found');

    await this.invitationRepository.remove(invitation);
  }

  async resend(invitationId: string, orgId: string, user: UserEntity): Promise<InvitationEntity> {
    const hasPermission = await this.orgMemberRepository.hasRole(user.Id, orgId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);
    if (!hasPermission) throw new ForbiddenException('You cannot resend invitations');

    const invitations = await this.invitationRepository.findPendingByOrg(orgId);
    const invitation = invitations.find((i) => i.Id === invitationId);
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.AcceptedAt) throw new BadRequestException('Invitation already accepted');

    invitation.Token = this.generateToken();
    invitation.ExpiresAt = new Date();
    invitation.ExpiresAt.setDate(invitation.ExpiresAt.getDate() + 7);
    const saved = await this.invitationRepository.save(invitation);

    const org = await this.organizationsService.findOne(orgId, user);
    const acceptUrl = `${this.frontendUrl}/invitations?token=${saved.Token}`;
    await this.emailService.sendInviteMember({
      to: invitation.Email,
      organizationName: org.Name,
      inviterName: user.FullName,
      role: invitation.Role,
      acceptUrl,
    });

    return saved;
  }
}
