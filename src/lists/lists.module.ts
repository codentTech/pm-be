import { Module } from '@nestjs/common';
import { BoardRepository } from 'src/common/repositories/board.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';

@Module({
  controllers: [ListsController],
  providers: [ListsService, ListRepository, BoardRepository],
  exports: [ListRepository],
})
export class ListsModule {}
