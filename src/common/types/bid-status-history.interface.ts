import { BidStatus } from './bid-status.enum';

export interface BidStatusHistoryEntry {
  Status: BidStatus;
  Timestamp: string;
  UserId?: string;
  Reason?: string;
}
