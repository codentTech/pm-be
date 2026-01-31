import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository } from 'src/common/repositories/board.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { ListEntity } from 'src/core/database/entities/list.entity';
import { CreateListDto, UpdateListDto } from './dto/list.dto';

@Injectable()
export class ListsService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  async create(dto: CreateListDto, user: UserEntity): Promise<ListEntity> {
    await this.assertBoardOwnership(dto.BoardId, user.Id);

    const position =
      dto.Position ??
      (await this.listRepository.getNextPositionForBoard(dto.BoardId));
    const list = this.listRepository.create({
      ...dto,
      Position: position,
      CreatedBy: user,
    });
    return this.listRepository.save(list);
  }

  async findAllByBoardId(boardId: string, user: UserEntity): Promise<ListEntity[]> {
    await this.assertBoardOwnership(boardId, user.Id);
    return this.listRepository.findAllByBoardId(boardId);
  }

  async findOne(id: string, user: UserEntity): Promise<ListEntity> {
    const list = await this.listRepository.findOneById(id, [
      'Board',
      'Board.CreatedBy',
      'Cards',
    ]);
    if (!list) throw new NotFoundException('List not found');
    if (list.Board?.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('Access denied');
    }
    return list;
  }

  async update(id: string, dto: UpdateListDto, user: UserEntity): Promise<ListEntity> {
    const list = await this.findOne(id, user);
    Object.assign(list, dto);
    return this.listRepository.save(list);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const list = await this.findOne(id, user);
    await this.listRepository.remove(list);
  }

  private async assertBoardOwnership(boardId: string, userId: string): Promise<void> {
    const board = await this.boardRepository.findOneById(boardId, ['CreatedBy']);
    if (!board) throw new NotFoundException('Board not found');
    if (board.CreatedBy?.Id !== userId) throw new ForbiddenException('Access denied');
  }
}
