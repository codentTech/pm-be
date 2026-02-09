import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

@Controller('cards/:cardId/comments')
@ApiTags('Comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add comment to card' })
  async create(
    @Param('cardId') cardId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.commentsService.create(
      cardId,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.CREATED, 'Comment added', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for card (paginated)' })
  async findByCardId(
    @Param('cardId') cardId: string,
    @Query() query: CommentQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = await this.commentsService.findByCardIdPaginated(
      cardId,
      req.user as UserEntity,
      page,
      limit,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Comments fetched', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update comment' })
  async update(
    @Param('cardId') cardId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.commentsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Comment updated', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.commentsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Comment deleted');
  }
}
