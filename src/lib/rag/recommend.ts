import { getMenu, getSalesOverview } from '@/lib/demoStore'
import { formatCents, type MenuItem } from '@/types/database'
import type { RagAnswer, RagCitation, RagHit } from '@/lib/rag/types'

export type Season = 'summer' | 'monsoon' | 'winter'

const SEASON_LABEL: Record<Season, string> = {
  summer: 'summer (hot Hyderabad weather)',
  monsoon: 'monsoon',
  winter: 'winter / cooler evenings',
}

/** Map user intent → menu categories + name patterns. */
const CATEGORY_INTENTS: {
  id: string
  label: string
  categoryIds: string[]
  namePattern: RegExp
  queryPattern: RegExp
}[] = [
  {
    id: 'coffee',
    label: 'coffee',
    categoryIds: ['cat-hot-coffee', 'cat-iced-coffee'],
    namePattern: /coffee|latte|cappuccino|espresso|americano|mocha|macchiato|flat white|cold brew|affogato/i,
    queryPattern: /\bcoffees?\b|\blattes?\b|\bcappuccinos?\b|\bespressos?\b|\bamericanos?\b|\bmocha\b|\bcold\s*brew\b/i,
  },
  {
    id: 'shake',
    label: 'thickshakes',
    categoryIds: ['cat-shakes'],
    namePattern: /shake|thickshake|milkshake/i,
    queryPattern: /\b(thick)?shakes?\b|\bmilkshakes?\b/i,
  },
  {
    id: 'drink',
    label: 'refreshing drinks',
    categoryIds: ['cat-drinks'],
    namePattern: /lemonade|mojito|soda|juice|cooler|refresh/i,
    queryPattern: /\bdrinks?\b|\blemonade\b|\bmojito\b|\bjuice\b|\bcooler\b/i,
  },
  {
    id: 'pizza',
    label: 'pizza',
    categoryIds: ['cat-veg-pizza', 'cat-nv-pizza'],
    namePattern: /pizza/i,
    queryPattern: /\bpizzas?\b/i,
  },
  {
    id: 'pasta',
    label: 'pasta',
    categoryIds: ['cat-veg-pasta', 'cat-nv-pasta'],
    namePattern: /pasta|penne|spaghetti|alfredo|arrabbiata|aglio/i,
    queryPattern: /\bpastas?\b|\bpenne\b|\bspaghetti\b/i,
  },
  {
    id: 'burger',
    label: 'burgers',
    categoryIds: ['cat-veg-burgers', 'cat-nv-burgers'],
    namePattern: /burger/i,
    queryPattern: /\bburgers?\b/i,
  },
  {
    id: 'biryani',
    label: 'biryani & rice',
    categoryIds: ['cat-veg-biryani', 'cat-nv-biryani', 'cat-veg-bowls', 'cat-nv-bowls'],
    namePattern: /biryani|rice bowl|bowl/i,
    queryPattern: /\bbiryanis?\b|\brice\b|\bbowls?\b/i,
  },
  {
    id: 'sandwich',
    label: 'sandwiches',
    categoryIds: ['cat-veg-sandwiches', 'cat-nv-sandwiches'],
    namePattern: /sandwich/i,
    queryPattern: /\bsandwich(es)?\b/i,
  },
  {
    id: 'starter',
    label: 'starters',
    categoryIds: ['cat-veg-starters', 'cat-nv-starters'],
    namePattern: /fries|nachos|wings|popcorn|starter|garlic bread|wedges|onion rings/i,
    queryPattern: /\bstarters?\b|\bappetizers?\b|\bsnacks?\b|\bfries\b|\bnachos\b/i,
  },
]

export function seasonForMonth(month = new Date().getMonth() + 1): Season {
  if (month >= 3 && month <= 6) return 'summer'
  if (month >= 7 && month <= 9) return 'monsoon'
  return 'winter'
}

function detectSeason(query: string): Season | 'current' | null {
  const q = query.toLowerCase()
  if (/summer|hot weather|heat|sunny/.test(q)) return 'summer'
  if (/monsoon|rainy|rain/.test(q)) return 'monsoon'
  if (/winter|cold weather|cooler|christmas|november|december|january/.test(q)) return 'winter'
  if (/season|seasonal|this time|right now|today|weather/.test(q)) return 'current'
  return null
}

export function detectCategoryIntent(query: string) {
  const q = query.toLowerCase()
  // Prefer more specific drink intents before broad "drink"
  for (const intent of CATEGORY_INTENTS) {
    if (intent.queryPattern.test(q)) return intent
  }
  return null
}

export function isRecommendationQuery(query: string): boolean {
  const q = query.toLowerCase()
  return (
    /\bbest\b/.test(q) ||
    /\brecommend/.test(q) ||
    /\bmust[\s-]?try\b/.test(q) ||
    /\bpopular\b/.test(q) ||
    /\bfavorite|favourite\b/.test(q) ||
    /\btop\s+(dish|food|item|seller)/.test(q) ||
    /\bwhat\s+should\s+i\s+(eat|order|try|drink)/.test(q) ||
    /\bseason/.test(q) ||
    /\bsuggest/.test(q) ||
    // "best coffee" / category + recommend vibe
    (detectCategoryIntent(query) !== null &&
      /\b(best|good|try|order|suggest|recommend|popular|top)\b/.test(q))
  )
}

const SEASON_HINTS: Record<Season, { blurb: string; prefer: RegExp }> = {
  summer: {
    blurb:
      'For Hyderabad summer heat, cooler drinks and lighter plates usually feel best on the rooftop.',
    prefer: /cold coffee|iced|thickshake|shake|fries|nachos|salad|corn|lemonade|refresh|mocha|blend/i,
  },
  monsoon: {
    blurb:
      'In monsoon, guests often want warmer comfort — hot coffee, pasta, pizza, and biryani bowls.',
    prefer: /cappuccino|latte|espresso|americano|pasta|pizza|biryani|hot coffee/i,
  },
  winter: {
    blurb:
      'On cooler evenings, rooftop favourites are hot coffee, hearty plates, pizza, and biryani.',
    prefer: /cappuccino|latte|espresso|pizza|biryani|pasta|burger|hot coffee|thickshake/i,
  },
}

function availableItems() {
  return getMenu().items.filter((i) => i.is_available)
}

function filterByCategory(
  items: MenuItem[],
  intent: NonNullable<ReturnType<typeof detectCategoryIntent>>,
) {
  return items.filter(
    (i) => intent.categoryIds.includes(i.category_id) || intent.namePattern.test(i.name),
  )
}

function rankInPool(pool: MenuItem[], limit = 3): MenuItem[] {
  if (!pool.length) return []

  const byName = new Map(pool.map((i) => [i.name, i]))
  const sales = getSalesOverview().top_items
  const fromSales: MenuItem[] = []
  for (const s of sales) {
    const item = byName.get(s.name)
    if (item) fromSales.push(item)
    if (fromSales.length >= limit) break
  }
  if (fromSales.length >= limit) return fromSales.slice(0, limit)

  const remaining = pool.filter((i) => !fromSales.includes(i))
  // Prefer well-known house names within the pool
  const preferredOrder = [
    'Espresso',
    'Cappuccino',
    'Cafe Latte',
    'Americano',
    'Classic Cold Coffee',
    'Margherita Pizza',
    'Oreo Thickshake',
  ]
  const preferred = preferredOrder
    .map((n) => remaining.find((i) => i.name === n))
    .filter(Boolean) as MenuItem[]

  const rest = remaining.filter((i) => !preferred.includes(i))
  return [...fromSales, ...preferred, ...rest].slice(0, limit)
}

function seasonalPicks(season: Season, limit = 3, categoryFilter?: MenuItem[]) {
  const hint = SEASON_HINTS[season]
  const items = categoryFilter ?? availableItems()
  const matched = items.filter((i) => hint.prefer.test(i.name))
  const pool = matched.length ? matched : items
  return rankInPool(pool, limit)
}

function hitsFromItems(items: MenuItem[]): RagHit[] {
  return items.map((item, idx) => {
    const mins = Math.max(1, Math.round(item.prep_time_seconds / 60))
    return {
      chunk: {
        id: `rec-${item.id}`,
        documentId: `menu-${item.id}`,
        title: item.name,
        kind: 'menu' as const,
        text: `${item.name} — ${formatCents(item.price_cents)}, ~${mins} min prep. Category recommendation only.`,
        metadata: { price: formatCents(item.price_cents) },
      },
      score: 1 - idx * 0.05,
    }
  })
}

/**
 * Grounded recommendations — respects category (e.g. coffee → coffee only).
 */
export function answerRecommendation(query: string): RagAnswer {
  const seasonHint = detectSeason(query)
  const season = seasonHint === 'current' || seasonHint === null ? seasonForMonth() : seasonHint
  const wantsSeason = seasonHint !== null || /season|weather|summer|winter|monsoon/i.test(query)
  const category = detectCategoryIntent(query)

  const all = availableItems()
  const pool = category ? filterByCategory(all, category) : all

  let picks: MenuItem[] = []
  const lines: string[] = []

  if (category && pool.length === 0) {
    return {
      answer: `I couldn’t find available ${category.label} on the menu right now. Try another category or open the Menu page.`,
      citations: [],
      confidence: 'medium',
      refused: false,
      retrieved: [],
    }
  }

  if (category) {
    picks = wantsSeason
      ? seasonalPicks(season, 3, pool)
      : rankInPool(pool, 3)

    lines.push(
      wantsSeason
        ? `For ${SEASON_LABEL[season]}, here are our top ${Math.min(3, picks.length)} ${category.label} picks:`
        : `Our top ${Math.min(3, picks.length)} ${category.label} picks:`,
    )
  } else if (wantsSeason) {
    picks = seasonalPicks(season, 3)
    lines.push(`${SEASON_HINTS[season].blurb} We’re in ${SEASON_LABEL[season]}.`)
    lines.push('')
    lines.push(`Our top ${Math.min(3, picks.length)} picks:`)
  } else {
    picks = rankInPool(all, 3)
    lines.push(`Our top ${Math.min(3, picks.length)} picks:`)
  }

  for (const item of picks) {
    lines.push(`• ${item.name} — ${formatCents(item.price_cents)}`)
  }

  lines.push('')
  lines.push(
    category
      ? `These are from our ${category.label} menu only. Open Menu to order — pay at the counter on pickup.`
      : 'Open the Menu page to add any of these to your cart. Pay at the counter on pickup.',
  )

  const citations: RagCitation[] = picks.map((item) => ({
    id: `rec-${item.id}`,
    title: item.name,
    kind: 'menu',
  }))

  return {
    answer: lines.join('\n').trim(),
    citations: citations.slice(0, 3),
    confidence: 'high',
    refused: false,
    retrieved: hitsFromItems(picks),
  }
}
