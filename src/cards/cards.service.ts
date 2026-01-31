import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CardEntity } from 'src/core/database/entities/card.entity';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';

@Injectable()
export class CardsService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
  ) {}

  async create(dto: CreateCardDto, user: UserEntity): Promise<CardEntity> {
    await this.assertListOwnership(dto.ListId, user.Id);

    const position =
      dto.Position ??
      (await this.cardRepository.getNextPositionForList(dto.ListId));
    const card = this.cardRepository.create({
      ...dto,
      Position: position,
      DueDate: dto.DueDate ? new Date(dto.DueDate) : undefined,
      CreatedBy: user,
    });
    return this.cardRepository.save(card);
  }

  async findOne(id: string, user: UserEntity): Promise<CardEntity> {
    const card = await this.cardRepository.findOneById(id, [
      'List',
      'List.Board',
      'List.Board.CreatedBy',
    ]);
    if (!card) throw new NotFoundException('Card not found');
    if (card.List?.Board?.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('Access denied');
    }
    return card;
  }

  async update(id: string, dto: UpdateCardDto, user: UserEntity): Promise<CardEntity> {
    const card = await this.findOne(id, user);

    if (dto.ListId && dto.ListId !== card.ListId) {
      await this.assertListOwnership(dto.ListId, user.Id);
      card.ListId = dto.ListId;
    }
    if (dto.DueDate !== undefined) {
      card.DueDate = dto.DueDate ? new Date(dto.DueDate) : null;
    }
    if (dto.Title !== undefined) card.Title = dto.Title;
    if (dto.Description !== undefined) card.Description = dto.Description;
    if (dto.Position !== undefined) card.Position = dto.Position;

    return this.cardRepository.save(card);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const card = await this.findOne(id, user);
    await this.cardRepository.remove(card);
  }

  private async assertListOwnership(listId: string, userId: string): Promise<void> {
    const list = await this.listRepository.findOneById(listId, [
      'Board',
      'Board.CreatedBy',
    ]);
    if (!list) throw new NotFoundException('List not found');
    if (list.Board?.CreatedBy?.Id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
