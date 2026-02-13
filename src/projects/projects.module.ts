import { Module } from '@nestjs/common';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { ListsModule } from 'src/lists/lists.module';
import { BidsModule } from 'src/bids/bids.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [OrganizationsModule, ListsModule, BidsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository, OrgMemberGuard],
  exports: [ProjectRepository],
})
export class ProjectsModule {}
