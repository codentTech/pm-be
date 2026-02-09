import { Module } from '@nestjs/common';
import { BoardRepository } from 'src/common/repositories/board.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { ListsModule } from 'src/lists/lists.module';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  imports: [OrganizationsModule, ListsModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardRepository, OrgMemberGuard],
  exports: [BoardRepository],
})
export class BoardsModule {}
