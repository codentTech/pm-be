import { Module } from "@nestjs/common";
import { OrgMemberGuard } from "src/common/guards/org-member.guard";
import { BidRepository } from "src/common/repositories/bid.repository";
import { OrganizationsModule } from "src/organizations/organizations.module";
import { BidsController } from "./bids.controller";
import { BidsService } from "./bids.service";

@Module({
  imports: [OrganizationsModule],
  controllers: [BidsController],
  providers: [BidsService, BidRepository, OrgMemberGuard],
  exports: [BidRepository],
})
export class BidsModule {}
