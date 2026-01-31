import { Module } from '@nestjs/common';
import { BoardRepository } from 'src/common/repositories/board.repository';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  controllers: [BoardsController],
  providers: [BoardsService, BoardRepository],
  exports: [BoardRepository],
})
export class BoardsModule {}
