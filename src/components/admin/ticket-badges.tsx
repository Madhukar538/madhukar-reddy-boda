import { TICKET_STATUS_LABELS, type TicketPriority, type TicketStatus } from '@/lib/admin/types';

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  P1: 'chip text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.14)]',
  P2: 'chip chip-orange',
  P3: 'chip chip-purple',
  P4: 'chip',
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: 'chip chip-accent',
  'in-progress': 'chip chip-orange',
  resolved: 'chip text-[hsl(var(--sys-green))] bg-[hsl(var(--sys-green)/0.14)]',
  closed: 'chip',
};

export function PriorityChip({ priority }: { priority: TicketPriority }) {
  return <span className={`${PRIORITY_CLASS[priority]} font-semibold tabular-nums`}>{priority}</span>;
}

export function StatusChip({ status }: { status: TicketStatus }) {
  return <span className={STATUS_CLASS[status]}>{TICKET_STATUS_LABELS[status]}</span>;
}
