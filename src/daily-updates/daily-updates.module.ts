import { Module } from '@nestjs/common';
import { DailyUpdatesService } from './daily-updates.service';
import { DailyUpdatesController } from './daily-updates.controller';
import { DailyUpdateRepository } from 'src/common/repositories/daily-update.repository';
import { DailyUpdateWorkItemRepository } from 'src/common/repositories/daily-update-work-item.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { CardRepository } from 'src/common/repositories/card.repository';
import { BidRepository } from 'src/common/repositories/bid.repository';

@Module({
  imports: [OrganizationsModule],
  controllers: [DailyUpdatesController],
  providers: [
    DailyUpdatesService,
    DailyUpdateRepository,
    DailyUpdateWorkItemRepository,
    OrganizationMemberRepository,
    OrgMemberGuard,
    CardRepository,
    BidRepository,
  ],
})
export class DailyUpdatesModule {}
