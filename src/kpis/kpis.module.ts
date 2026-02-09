import { Module } from '@nestjs/common';
import { KpiRepository } from 'src/common/repositories/kpi.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { KpisController } from './kpis.controller';
import { KpisService } from './kpis.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [KpisController],
  providers: [KpisService, KpiRepository, OrgMemberGuard],
  exports: [KpiRepository],
})
export class KpisModule {}
