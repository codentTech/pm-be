import { TicketStatus } from 'src/common/types/ticket-status.enum';

export const TICKET_VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.BACKLOG]: [TicketStatus.READY],
  [TicketStatus.READY]: [TicketStatus.IN_PROGRESS],
  [TicketStatus.IN_PROGRESS]: [
    TicketStatus.BLOCKED,
    TicketStatus.CODE_REVIEW,
  ],
  [TicketStatus.BLOCKED]: [TicketStatus.IN_PROGRESS],
  [TicketStatus.CODE_REVIEW]: [TicketStatus.QA],
  [TicketStatus.QA]: [TicketStatus.DONE],
  [TicketStatus.DONE]: [TicketStatus.REOPENED],
  [TicketStatus.REOPENED]: [TicketStatus.IN_PROGRESS],
};

export const TICKET_STATUS_BY_LIST_TITLE: Record<string, TicketStatus> = {
  backlog: TicketStatus.BACKLOG,
  ready: TicketStatus.READY,
  'in progress': TicketStatus.IN_PROGRESS,
  blocked: TicketStatus.BLOCKED,
  'code review': TicketStatus.CODE_REVIEW,
  'qa / validation': TicketStatus.QA,
  qa: TicketStatus.QA,
  done: TicketStatus.DONE,
  reopened: TicketStatus.REOPENED,
};
