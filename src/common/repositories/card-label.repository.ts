import { Injectable } from '@nestjs/common';
import { CardLabelEntity } from 'src/core/database/entities/card-label.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class CardLabelRepository {
  constructor(private dataSource: DataSource) {}

  private get repo() {
    return this.dataSource.getRepository(CardLabelEntity);
  }

  async setLabelsForCard(cardId: string, labelIds: string[]): Promise<void> {
    await this.repo.delete({ CardId: cardId });
    if (labelIds.length > 0) {
      await this.repo.insert(
        labelIds.map((LabelId) => ({ CardId: cardId, LabelId })),
      );
    }
  }

  async findByCardId(cardId: string): Promise<CardLabelEntity[]> {
    return this.repo.find({
      where: { CardId: cardId },
      relations: ['Label'],
    });
  }
}
