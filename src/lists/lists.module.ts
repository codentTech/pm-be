import { Module } from '@nestjs/common';
import { BoardRepository } from 'src/common/repositories/board.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';

@Module({
  imports: [WebsocketModule],
  controllers: [ListsController],
  providers: [ListsService, ListRepository, BoardRepository],
  exports: [ListRepository, ListsService],
})
export class ListsModule {}
