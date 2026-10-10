import { CAFE } from '@/lib/cafe'
import { getMenu } from '@/lib/demoStore'
import { formatCents } from '@/types/database'
import type { RagChunk, RagDocument } from '@/lib/rag/types'

const FAQ_DOCS: RagDocument[] = [
  {
    id: 'doc-about',
    title: 'About Maña Katha',
    kind: 'cafe',
    text: `Maña Katha Café (MKC) is a rooftop café in Vanasthalipuram, Hyderabad. Idi MaNa Katha means our story. Let's begin our story. Known as one of the largest rooftop cafés in Hyderabad. Coffee, plates, shakes, and long evenings on the roof. Instagram ${CAFE.handle} at ${CAFE.instagram}.`,
  },
  {
    id: 'doc-location',
    title: 'Location & contact',
    kind: 'location',
    text: `Address: ${CAFE.addressLines.join(', ')}. Phone ${CAFE.phone}. Google Maps: ${CAFE.maps}. We are on the 5th and 6th floor of BNR Tower, Panama Godowns, above Mithaiwala, Vanasthalipuram, Hyderabad 500070.`,
  },
  {
    id: 'doc-hours',
    title: 'Opening hours',
    kind: 'hours',
    text: `Maña Katha is typically open daily from 12:00 PM to 11:30 PM. Hours may vary on holidays — check Instagram ${CAFE.handle} for updates. Closes around 11:30 PM on regular days.`,
  },
  {
    id: 'doc-ordering',
    title: 'How ordering works',
    kind: 'ordering',
    text: `Order ahead on this website: browse the menu, add items to cart, enter your pickup name, and place the order. We prepare on the floor while you travel. Pay at the counter when you arrive — there is no online payment. Track your order status with the tracking link after checkout. Sold-out items cannot be ordered.`,
  },
  {
    id: 'doc-policy',
    title: 'Policies',
    kind: 'policy',
    text: `Payment is only at the counter (cash / UPI as accepted on site). Orders can be cancelled by staff before completion. Prep times shown on the menu are estimates. For large groups, call ${CAFE.phone} or message Instagram ${CAFE.handle}. This assistant only answers questions about Maña Katha Café — menu, hours, location, and ordering.`,
  },
  {
    id: 'doc-faq-wifi',
    title: 'FAQ — visit tips',
    kind: 'faq',
    text: `We are a rooftop café suitable for friends, family, and celebrations. Parking and building access follow BNR Tower / Panama Godowns rules. For the latest ambience photos and offers, see Instagram ${CAFE.handle}.`,
  },
  {
    id: 'doc-recommend',
    title: 'Recommendations & seasonal picks',
    kind: 'faq',
    text: `Best food and recommendations: ask for best dishes, popular items, must-try, or seasonal food. In Hyderabad summer we suggest iced coffee, cold coffee, thickshakes, and lighter starters. In monsoon prefer hot coffee, pasta, pizza, and biryani. In winter enjoy hot coffee, pizza, biryani, and hearty plates on the rooftop. House favourites include Margherita Pizza, Cappuccino, Chicken Mogali Biryani, Oreo Thickshake, and Alfredo Veg Penne Pasta. Popular picks also come from recent completed guest orders when available.`,
  },
]

function chunkText(doc: RagDocument, maxLen = 420): RagChunk[] {
  const parts = doc.text
    .split(/(?<=\.)\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks: RagChunk[] = []
  let buf = ''
  let i = 0

  const flush = () => {
    if (!buf.trim()) return
    chunks.push({
      id: `${doc.id}#${i++}`,
      documentId: doc.id,
      title: doc.title,
      kind: doc.kind,
      text: buf.trim(),
      metadata: doc.metadata,
    })
    buf = ''
  }

  for (const part of parts) {
    if ((buf + ' ' + part).trim().length > maxLen) {
      flush()
      buf = part
    } else {
      buf = buf ? `${buf} ${part}` : part
    }
  }
  flush()
  return chunks.length ? chunks : [{ id: `${doc.id}#0`, documentId: doc.id, title: doc.title, kind: doc.kind, text: doc.text, metadata: doc.metadata }]
}

function menuDocuments(): RagDocument[] {
  const { categories, items } = getMenu()
  const catName = new Map(categories.map((c) => [c.id, c.name]))

  return items.map((item) => {
    const category = catName.get(item.category_id) ?? 'Menu'
    const mins = Math.max(1, Math.round(item.prep_time_seconds / 60))
    const avail = item.is_available ? 'available' : 'sold out'
    return {
      id: `menu-${item.id}`,
      title: item.name,
      kind: 'menu' as const,
      text: `${item.name} is in the ${category} category. Price ${formatCents(item.price_cents)}. Estimated prep about ${mins} minutes. Currently ${avail}.${item.description ? ` ${item.description}` : ''} Order from the Menu page on this site.`,
      metadata: {
        category,
        price: formatCents(item.price_cents),
        available: String(item.is_available),
      },
    }
  })
}

/** Build live RAG chunks (menu reflects sold-out / prices). */
export function buildKnowledgeChunks(): RagChunk[] {
  const docs = [...FAQ_DOCS, ...menuDocuments()]
  return docs.flatMap(chunkText)
}
