import { Module } from '@nestjs/common';
import { CardRepository } from 'src/common/repositories/card.repository';
import { CommentRepository } from 'src/common/repositories/comment.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentRepository, CardRepository, ListRepository],
  exports: [CommentsService],
})
export class CommentsModule {}
