import { Module } from '@nestjs/common';
import { InvitationRepository } from 'src/common/repositories/invitation.repository';
import { OrganizationRepository } from 'src/common/repositories/organization.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [UserModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationRepository,
    OrganizationMemberRepository,
    InvitationRepository,
    OrgMemberGuard,
    SuperAdminGuard,
  ],
  exports: [OrganizationsService, OrganizationRepository, OrganizationMemberRepository],
})
export class OrganizationsModule {}
