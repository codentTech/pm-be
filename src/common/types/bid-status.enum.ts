export enum BidStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VIEWED = 'viewed',
  INTERVIEW = 'interview',
  WON = 'won',
  LOST = 'lost',
  GHOSTED = 'ghosted',
  WITHDRAWN = 'withdrawn',
}

export const BID_TERMINAL_STATES: BidStatus[] = [
  BidStatus.WON,
  BidStatus.LOST,
  BidStatus.GHOSTED,
  BidStatus.WITHDRAWN,
];
