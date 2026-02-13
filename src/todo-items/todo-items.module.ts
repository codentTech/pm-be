import { Module } from '@nestjs/common';
import { BidRepository } from 'src/common/repositories/bid.repository';
import { TodoItemRepository } from 'src/common/repositories/todo-item.repository';
import { TodoListRepository } from 'src/common/repositories/todo-list.repository';
import { TodoRecurrenceRepository } from 'src/common/repositories/todo-recurrence.repository';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { TodoItemsController } from './todo-items.controller';
import { TodoItemsService } from './todo-items.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [TodoItemsController],
  providers: [
    TodoItemsService,
    BidRepository,
    TodoItemRepository,
    TodoListRepository,
    TodoRecurrenceRepository,
  ],
})
export class TodoItemsModule {}
