import { Module } from '@nestjs/common';
import { CardAssigneeRepository } from 'src/common/repositories/card-assignee.repository';
import { CardLabelRepository } from 'src/common/repositories/card-label.repository';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { LabelsModule } from 'src/labels/labels.module';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [WebsocketModule, LabelsModule, OrganizationsModule],
  controllers: [CardsController],
  providers: [
    CardsService,
    CardRepository,
    ListRepository,
    ProjectRepository,
    CardLabelRepository,
    CardAssigneeRepository,
  ],
  exports: [CardRepository],
})
export class CardsModule {}
