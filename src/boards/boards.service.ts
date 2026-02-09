import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_BOARD_LISTS } from 'src/common/constants/board.constant';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { BoardRepository } from 'src/common/repositories/board.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { BoardEntity } from 'src/core/database/entities/board.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { ListsService } from 'src/lists/lists.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';

@Injectable()
export class BoardsService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly listsService: ListsService,
  ) {}

  private async resolveOrgId(user: UserEntity, orgId?: string | null): Promise<string> {
    if (orgId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, orgId);
      if (!isMember) throw new ForbiddenException('You are not a member of this organization');
      return orgId;
    }
    const defaultOrg = await this.organizationsService.getOrEnsureDefaultOrg(user);
    return defaultOrg.Id;
  }

  async create(dto: CreateBoardDto, user: UserEntity, orgId?: string | null): Promise<BoardEntity> {
    const resolvedOrgId = await this.resolveOrgId(user, orgId ?? dto.OrganizationId);
    const board = this.boardRepository.create({
      Name: dto.Name,
      Description: dto.Description,
      OrganizationId: resolvedOrgId,
      CreatedBy: user,
    });
    const savedBoard = await this.boardRepository.save(board);

    for (let i = 0; i < DEFAULT_BOARD_LISTS.length; i++) {
      await this.listsService.create(
        { Title: DEFAULT_BOARD_LISTS[i], BoardId: savedBoard.Id, Position: i },
        user,
      );
    }

    return savedBoard;
  }

  async findAll(user: UserEntity, orgId?: string | null): Promise<BoardEntity[]> {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const boards = await this.boardRepository.findAllByUserAndOrg(user.Id, resolvedOrgId);
    return boards.map((b) => ({
      ...b,
      Description: b.Description ?? null,
      description: b.Description ?? null,
    })) as BoardEntity[];
  }

  async findAllPaginated(
    user: UserEntity,
    orgId: string | null | undefined,
    page: number,
    limit: number,
    sort?: string,
    order?: 'asc' | 'desc',
  ) {
    const resolvedOrgId = orgId
      ? await this.resolveOrgId(user, orgId)
      : (await this.organizationsService.getOrEnsureDefaultOrg(user)).Id;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.boardRepository.findAllByUserAndOrgPaginated(
      resolvedOrgId,
      skip,
      take,
      sort ?? 'CreatedAt',
      (order ?? 'desc').toUpperCase() as 'ASC' | 'DESC',
    );
    const boards = items.map((b) => ({
      ...b,
      Description: b.Description ?? null,
      description: b.Description ?? null,
    })) as BoardEntity[];
    return createPaginatedResponse(boards, total, page, take);
  }

  async findOne(id: string, user: UserEntity): Promise<BoardEntity> {
    const board = await this.boardRepository.findOneByIdAndUser(id, user.Id);
    if (!board) throw new NotFoundException('Board not found');
    if (board.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, board.OrganizationId);
      if (!isMember) throw new ForbiddenException('You do not have access to this board');
    } else if (board.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('You do not have access to this board');
    }
    return board;
  }

  async update(id: string, dto: UpdateBoardDto, user: UserEntity): Promise<BoardEntity> {
    const board = await this.findOne(id, user);
    Object.assign(board, dto);
    return this.boardRepository.save(board);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const board = await this.findOne(id, user);
    await this.boardRepository.remove(board);
  }
}
