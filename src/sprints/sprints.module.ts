import { Module } from '@nestjs/common';
import { SprintRepository } from 'src/common/repositories/sprint.repository';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';

@Module({
  controllers: [SprintsController],
  providers: [SprintsService, SprintRepository, ProjectRepository, OrganizationMemberRepository],
  exports: [SprintsService, SprintRepository],
})
export class SprintsModule {}
