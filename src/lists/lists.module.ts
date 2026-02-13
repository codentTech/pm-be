import { Module } from '@nestjs/common';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';

@Module({
  imports: [WebsocketModule],
  controllers: [ListsController],
  providers: [ListsService, ListRepository, ProjectRepository],
  exports: [ListRepository, ListsService],
})
export class ListsModule {}
