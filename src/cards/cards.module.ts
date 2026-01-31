import { Module } from '@nestjs/common';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  controllers: [CardsController],
  providers: [CardsService, CardRepository, ListRepository],
  exports: [CardRepository],
})
export class CardsModule {}
