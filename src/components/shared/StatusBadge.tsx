import type { OrderStatus } from '@/types/database'

const LABELS: Record<OrderStatus, string> = {
  received: 'Received',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STYLES: Record<OrderStatus, string> = {
  received: 'bg-clay/20 text-clay',
  accepted: 'bg-leaf/15 text-leaf',
  preparing: 'bg-leaf/25 text-leaf',
  ready: 'bg-leaf text-ink',
  completed: 'bg-steam/20 text-steam',
  cancelled: 'bg-red-400/15 text-red-300',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
