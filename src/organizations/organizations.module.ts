import { Module } from '@nestjs/common';
import { OrganizationRepository } from 'src/common/repositories/organization.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationRepository,
    OrganizationMemberRepository,
    OrgMemberGuard,
  ],
  exports: [OrganizationsService, OrganizationRepository, OrganizationMemberRepository],
})
export class OrganizationsModule {}
