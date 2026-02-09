import { Module } from '@nestjs/common';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ChecklistItemRepository } from 'src/common/repositories/checklist-item.repository';
import { ChecklistRepository } from 'src/common/repositories/checklist.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [ChecklistsController],
  providers: [
    ChecklistsService,
    ChecklistRepository,
    ChecklistItemRepository,
    CardRepository,
    ListRepository,
  ],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
