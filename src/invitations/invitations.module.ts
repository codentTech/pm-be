import { Module } from '@nestjs/common';
import { InvitationRepository } from 'src/common/repositories/invitation.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { UserModule } from 'src/users/users.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [OrganizationsModule, UserModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationRepository, OrgMemberGuard],
  exports: [InvitationsService, InvitationRepository],
})
export class InvitationsModule {}
