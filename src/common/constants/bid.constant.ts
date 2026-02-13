import { BidStatus } from 'src/common/types/bid-status.enum';

export const BID_VALID_TRANSITIONS: Record<BidStatus, BidStatus[]> = {
  [BidStatus.DRAFT]: [BidStatus.SUBMITTED, BidStatus.WITHDRAWN],
  [BidStatus.SUBMITTED]: [BidStatus.VIEWED, BidStatus.INTERVIEW, BidStatus.GHOSTED, BidStatus.WITHDRAWN],
  [BidStatus.VIEWED]: [BidStatus.INTERVIEW, BidStatus.GHOSTED],
  [BidStatus.INTERVIEW]: [BidStatus.WON, BidStatus.LOST, BidStatus.GHOSTED],
  [BidStatus.WON]: [],
  [BidStatus.LOST]: [],
  [BidStatus.GHOSTED]: [],
  [BidStatus.WITHDRAWN]: [],
};

// System-wide thresholds (MVP defaults)
export const BID_DRAFT_AGING_DAYS = 7;
export const BID_FOLLOW_UP_SLA_DAYS = 3;
export const BID_GHOSTED_SUGGEST_DAYS = 14;
