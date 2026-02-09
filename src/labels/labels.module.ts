import { Module } from '@nestjs/common';
import { LabelRepository } from 'src/common/repositories/label.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [LabelsController],
  providers: [LabelsService, LabelRepository, OrgMemberGuard],
  exports: [LabelsService, LabelRepository],
})
export class LabelsModule {}
