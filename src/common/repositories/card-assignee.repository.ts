import { Injectable } from '@nestjs/common';
import { CardAssigneeEntity } from 'src/core/database/entities/card-assignee.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class CardAssigneeRepository {
  constructor(private dataSource: DataSource) {}

  private get repo() {
    return this.dataSource.getRepository(CardAssigneeEntity);
  }

  async setAssigneesForCard(cardId: string, userIds: string[]): Promise<void> {
    if (!cardId) return;
    await this.repo.delete({ CardId: cardId });
    const validUserIds = userIds.filter((id) => id != null && id !== '');
    for (const userId of validUserIds) {
      await this.dataSource.query(
        'INSERT INTO "CardAssignees" ("CardId", "UserId") VALUES ($1, $2)',
        [cardId, userId],
      );
    }
  }

  async findByCardId(cardId: string): Promise<CardAssigneeEntity[]> {
    return this.repo.find({
      where: { CardId: cardId },
      relations: ['User'],
    });
  }
}
