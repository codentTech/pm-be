import { DailyUpdateRole } from 'src/common/types/daily-update-role.enum';

export const DAILY_UPDATE_CUTOFF_HOURS = 6;
export const DAILY_TIME_CAP_HOURS = 12;

export const WORK_ITEM_TYPES_BY_ROLE: Record<DailyUpdateRole, string[]> = {
  [DailyUpdateRole.DEVELOPER]: [
    'ticket_work',
    'bug_fix',
    'code_review',
    'meeting',
    'support',
    'tech_debt',
  ],
  [DailyUpdateRole.QA]: [
    'ticket_work',
    'bug_fix',
    'code_review',
    'meeting',
    'support',
    'tech_debt',
  ],
  [DailyUpdateRole.PM]: [
    'ticket_work',
    'meeting',
    'support',
    'tech_debt',
  ],
  [DailyUpdateRole.BD]: [
    'bid_drafted',
    'bid_submitted',
    'follow_up',
    'interview',
    'proposal_revision',
    'client_communication',
    'research',
  ],
};

export const WORK_ITEM_TYPES_REQUIRE_REFERENCE = new Set([
  'ticket_work',
  'bug_fix',
  'bid_drafted',
  'bid_submitted',
  'follow_up',
  'interview',
  'proposal_revision',
]);

export const WORK_ITEM_TYPES_TICKET = new Set(['ticket_work', 'bug_fix']);
export const WORK_ITEM_TYPES_BID = new Set([
  'bid_drafted',
  'bid_submitted',
  'follow_up',
  'interview',
  'proposal_revision',
]);
