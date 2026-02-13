import { TicketStatus } from 'src/common/types/ticket-status.enum';

export interface TicketStatusHistoryEntry {
  Status: TicketStatus;
  Timestamp: string;
  UserId?: string;
  Reason?: string;
}
