import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository } from 'src/common/repositories/board.repository';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { BoardEntity } from 'src/core/database/entities/board.entity';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly boardRepository: BoardRepository) {}

  async create(dto: CreateBoardDto, user: UserEntity): Promise<BoardEntity> {
    const board = this.boardRepository.create({ ...dto, CreatedBy: user });
    return this.boardRepository.save(board);
  }

  async findAll(user: UserEntity): Promise<BoardEntity[]> {
    return this.boardRepository.findAllByUserId(user.Id);
  }

  async findOne(id: string, user: UserEntity): Promise<BoardEntity> {
    const board = await this.boardRepository.findOneByIdAndUserId(id, user.Id);
    if (!board) throw new NotFoundException('Board not found');
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
