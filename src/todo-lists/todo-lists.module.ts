import { Module } from '@nestjs/common';
import { TodoListRepository } from 'src/common/repositories/todo-list.repository';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { TodoListsController } from './todo-lists.controller';
import { TodoListsService } from './todo-lists.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [TodoListsController],
  providers: [TodoListsService, TodoListRepository, OrgMemberGuard],
  exports: [TodoListRepository],
})
export class TodoListsModule {}
