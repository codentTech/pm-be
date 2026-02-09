import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CardRepository } from 'src/common/repositories/card.repository';
import { CommentRepository } from 'src/common/repositories/comment.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { CommentEntity } from 'src/core/database/entities/comment.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  private async ensureCardAccess(cardId: string, userId: string): Promise<void> {
    const card = await this.cardRepository.findOneById(cardId, [
      'List',
      'List.Board',
      'List.Board.CreatedBy',
    ]);
    if (!card) throw new NotFoundException('Card not found');
    const board = card.List?.Board;
    if (board?.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(userId, board.OrganizationId);
      if (!isMember) throw new ForbiddenException('Access denied');
    } else if (board?.CreatedBy?.Id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async create(
    cardId: string,
    dto: CreateCommentDto,
    user: UserEntity,
  ): Promise<CommentEntity> {
    await this.ensureCardAccess(cardId, user.Id);
    const comment = this.commentRepository.create({
      CardId: cardId,
      UserId: user.Id,
      Content: dto.Content,
      ParentId: dto.ParentId ?? null,
      CreatedBy: user,
    });
    return this.commentRepository.save(comment);
  }

  async findByCardId(cardId: string, user: UserEntity): Promise<CommentEntity[]> {
    await this.ensureCardAccess(cardId, user.Id);
    return this.commentRepository.findByCardId(cardId);
  }

  async findByCardIdPaginated(
    cardId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.ensureCardAccess(cardId, user.Id);
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.commentRepository.findByCardIdPaginated(
      cardId,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async update(id: string, dto: UpdateCommentDto, user: UserEntity): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.UserId !== user.Id) throw new ForbiddenException('You can only edit your own comments');
    await this.ensureCardAccess(comment.CardId, user.Id);
    Object.assign(comment, dto);
    return this.commentRepository.save(comment);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.UserId !== user.Id) throw new ForbiddenException('You can only delete your own comments');
    await this.ensureCardAccess(comment.CardId, user.Id);
    await this.commentRepository.remove(comment);
  }
}
