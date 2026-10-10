import { contributionRows, listOrders } from '@/lib/demoStore'
import { formatCents } from '@/types/database'

export interface InsightEvidence {
  id: string
  source: string
  summary: string
}

export interface InsightResult {
  title: string
  answer: string
  confidence: 'high' | 'medium' | 'low'
  evidence: InsightEvidence[]
  metrics: Record<string, string | number>
}

/**
 * Deterministic "AI" tools over live demo data — no external LLM required for the hackathon demo.
 * Staff JWT / allowlisted tools would wrap this on a real server.
 */
export function analyzeStaffPrompt(prompt: string): InsightResult {
  const q = prompt.toLowerCase()
  const rows = contributionRows()
  const orders = listOrders().filter((o) => o.status !== 'cancelled')

  const withMargin = rows.filter(
    (r) => r.contribution_cents !== null && r.units_sold > 0,
  ) as Array<{
    item: (typeof rows)[0]['item']
    cost_cents: number
    contribution_cents: number
    units_sold: number
    total_contribution_cents: number
  }>

  const worst = [...withMargin].sort(
    (a, b) => a.contribution_cents - b.contribution_cents,
  )[0]

  const bestTotal = [...withMargin].sort(
    (a, b) => (b.total_contribution_cents ?? 0) - (a.total_contribution_cents ?? 0),
  )[0]

  const incomplete = rows.filter((r) => r.cost_cents === null)

  const wantsWorst =
    q.includes('worst') ||
    q.includes('lowest') ||
    q.includes('thin') ||
    q.includes('margin') ||
    q.includes('lunch') ||
    q.trim() === '' ||
    q.includes('insight')

  const wantsRush =
    q.includes('rush') || q.includes('busy') || q.includes('queue') || q.includes('prep')

  if (wantsRush) {
    const active = orders.filter((o) =>
      ['received', 'accepted', 'preparing', 'ready'].includes(o.status),
    )
    const avgPrep =
      orders
        .filter((o) => o.preparing_at && o.ready_at)
        .reduce((n, o) => {
          return (
            n +
            (new Date(o.ready_at!).getTime() - new Date(o.preparing_at!).getTime()) / 1000
          )
        }, 0) / Math.max(1, orders.filter((o) => o.preparing_at && o.ready_at).length)

    return {
      title: 'Floor load',
      answer:
        active.length === 0
          ? 'No active tickets. Quiet floor — good time to prep mise or push a slow sweet.'
          : `There are ${active.length} active ticket(s). Average prep on completed tickets is ~${Math.round(avgPrep / 60)} min. Watch overdue cards on the queue (age > estimated prep).`,
      confidence: orders.length > 0 ? 'high' : 'low',
      evidence: [
        {
          id: 'ev-queue',
          source: 'orders',
          summary: `${active.length} active / ${orders.length} non-cancelled orders in demo store`,
        },
        {
          id: 'ev-prep',
          source: 'order_status_events',
          summary: `Avg preparing→ready: ${Math.round(avgPrep)}s from completed tickets`,
        },
      ],
      metrics: {
        active_orders: active.length,
        avg_prep_seconds: Math.round(avgPrep),
      },
    }
  }

  if (wantsWorst && worst) {
    return {
      title: 'Thinnest contribution margin',
      answer: `${worst.item.name} has the lowest contribution at ${formatCents(worst.contribution_cents)} per unit (price ${formatCents(worst.item.price_cents)} − cost ${formatCents(worst.cost_cents)}). Sold ${worst.units_sold} unit(s) this session.`,
      confidence: 'high',
      evidence: [
        {
          id: 'ev-item',
          source: 'contribution',
          summary: `${worst.item.name}: price ${formatCents(worst.item.price_cents)}, recipe cost ${formatCents(worst.cost_cents)}`,
        },
        {
          id: 'ev-sales',
          source: 'order_items',
          summary: `${worst.units_sold} units sold across non-cancelled orders`,
        },
        ...(incomplete.length
          ? [
              {
                id: 'ev-gap',
                source: 'recipes',
                summary: `${incomplete.length} item(s) lack full recipe cost (e.g. ${incomplete[0].item.name})`,
              },
            ]
          : []),
      ],
      metrics: {
        item: worst.item.name,
        contribution_paise: worst.contribution_cents,
        units_sold: worst.units_sold,
      },
    }
  }

  if (bestTotal) {
    return {
      title: 'Top contribution',
      answer: `${bestTotal.item.name} leads total contribution at ${formatCents(bestTotal.total_contribution_cents)} across ${bestTotal.units_sold} unit(s).`,
      confidence: withMargin.length ? 'medium' : 'low',
      evidence: [
        {
          id: 'ev-best',
          source: 'contribution',
          summary: `${bestTotal.item.name} total contrib ${formatCents(bestTotal.total_contribution_cents)}`,
        },
      ],
      metrics: {
        item: bestTotal.item.name,
        total_contribution_paise: bestTotal.total_contribution_cents,
      },
    }
  }

  return {
    title: 'Not enough sales yet',
    answer:
      'Place a few customer orders and complete them, then ask again — contribution needs sold units with full recipes.',
    confidence: 'low',
    evidence: [
      {
        id: 'ev-empty',
        source: 'orders',
        summary: `${orders.length} orders; ${withMargin.length} items with margin + sales`,
      },
    ],
    metrics: { orders: orders.length },
  }
}
