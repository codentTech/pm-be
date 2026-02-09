import { Module } from '@nestjs/common';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [SearchController],
  providers: [SearchService, OrgMemberGuard],
  exports: [SearchService],
})
export class SearchModule {}
