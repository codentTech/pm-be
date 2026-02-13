import { Module } from '@nestjs/common';
import { WikiController } from './wiki.controller';
import { WikiService } from './wiki.service';
import { WikiPageRepository } from 'src/common/repositories/wiki-page.repository';
import { WikiAttachmentRepository } from 'src/common/repositories/wiki-attachment.repository';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';

@Module({
  controllers: [WikiController],
  providers: [
    WikiService,
    WikiPageRepository,
    WikiAttachmentRepository,
    ProjectRepository,
    OrganizationMemberRepository,
  ],
})
export class WikiModule {}
