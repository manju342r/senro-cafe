import { orderTrackingUrl } from '@/lib/orderRef'
import { formatCents, type OrderWithItems } from '@/types/database'

const INK = '#1a1210'
const FOREST = '#2a1f1a'
const LEAF = '#f0c14b'
const FOAM = '#f3ebe0'
const STEAM = '#b5a494'
const LINE = 'rgba(240, 193, 75, 0.28)'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load logo'))
    img.src = src
  })
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function buildJpegPdf(jpeg: Uint8Array, imgW: number, imgH: number): Blob {
  const pageW = 595
  const pageH = Math.round((imgH / imgW) * pageW)
  const objects: string[] = []

  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n')
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n')
  objects.push(
    `3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>endobj\n`,
  )
  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`
  objects.push(`4 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj\n`)

  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  const header = encoder.encode('%PDF-1.4\n')
  parts.push(header)

  const offsets = [0]
  let offset = header.length

  for (let i = 0; i < 4; i++) {
    offsets.push(offset)
    const bytes = encoder.encode(objects[i])
    parts.push(bytes)
    offset += bytes.length
  }

  // Image object with binary stream
  offsets.push(offset)
  const imgHeader = encoder.encode(
    `5 0 obj<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>stream\n`,
  )
  const imgFooter = encoder.encode('\nendstream\nendobj\n')
  parts.push(imgHeader, jpeg, imgFooter)
  offset += imgHeader.length + jpeg.length + imgFooter.length

  const xrefStart = offset
  let xref = `xref\n0 6\n0000000000 65535 f \n`
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  parts.push(encoder.encode(xref))

  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return new Blob([out], { type: 'application/pdf' })
}

async function renderReceiptCanvas(order: OrderWithItems): Promise<HTMLCanvasElement> {
  const width = 794
  const pad = 48
  const contentW = width - pad * 2
  const tokenId = order.tracking_token
  const when = new Date(order.created_at).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const trackUrl = orderTrackingUrl(order.tracking_token)

  let logo: HTMLImageElement | null = null
  try {
    logo = await loadImage(`${window.location.origin}/logo.png`)
  } catch {
    logo = null
  }

  // Measure height first with an offscreen context
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = '500 15px Outfit, system-ui, sans-serif'
  let estimated = 420
  for (const item of order.items) {
    const nameLines = wrapText(measure, `${item.quantity}x ${item.item_name}`, contentW - 120)
    estimated += Math.max(28, nameLines.length * 20 + 10)
  }
  estimated += 220

  const height = Math.max(1123, estimated)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Background
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, width, height)

  // Soft gold edge glow
  const glow = ctx.createLinearGradient(0, 0, 0, 180)
  glow.addColorStop(0, 'rgba(240, 193, 75, 0.12)')
  glow.addColorStop(1, 'rgba(240, 193, 75, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, 180)

  // Top gold rule
  ctx.fillStyle = LEAF
  ctx.fillRect(0, 0, width, 4)

  let y = 40

  // Logo + wordmark
  if (logo) {
    const logoSize = 72
    ctx.drawImage(logo, pad, y, logoSize, logoSize)
    ctx.fillStyle = LEAF
    ctx.font = '600 34px "Cormorant Garamond", Georgia, serif'
    ctx.fillText('Maña Katha', pad + logoSize + 18, y + 34)
    ctx.fillStyle = STEAM
    ctx.font = '500 11px Outfit, system-ui, sans-serif'
    ctx.letterSpacing = '0.2em'
    ctx.fillText('ROOFTOP CAFÉ  ·  HYDERABAD', pad + logoSize + 18, y + 56)
    ctx.letterSpacing = '0px'
    y += logoSize + 28
  } else {
    ctx.fillStyle = LEAF
    ctx.font = '600 36px "Cormorant Garamond", Georgia, serif'
    ctx.fillText('Maña Katha', pad, y + 32)
    y += 64
  }

  // Title card
  drawRoundedRect(ctx, pad, y, contentW, 56, 4)
  ctx.fillStyle = FOREST
  ctx.fill()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = FOAM
  ctx.font = '500 13px Outfit, system-ui, sans-serif'
  ctx.fillText('ORDER RECEIPT', pad + 20, y + 24)
  ctx.fillStyle = LEAF
  ctx.font = '600 18px "Cormorant Garamond", Georgia, serif'
  ctx.fillText('Pay at the counter', pad + 20, y + 44)
  y += 76

  // Meta block
  const meta: [string, string][] = [
    ['Token ID', tokenId],
    ['Name', order.customer_name],
    ['Placed', when],
    ['Status', order.status],
  ]

  for (const [label, value] of meta) {
    ctx.fillStyle = STEAM
    ctx.font = '500 11px Outfit, system-ui, sans-serif'
    ctx.fillText(label.toUpperCase(), pad, y)
    ctx.fillStyle = FOAM
    ctx.font = label === 'Token ID' ? '600 13px ui-monospace, monospace' : '500 15px Outfit, system-ui, sans-serif'
    const valueLines = wrapText(ctx, value, contentW)
    let vy = y + 18
    for (const line of valueLines) {
      ctx.fillText(line, pad, vy)
      vy += 18
    }
    y = vy + 14
  }

  // Divider
  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(pad + contentW, y)
  ctx.stroke()
  y += 28

  ctx.fillStyle = LEAF
  ctx.font = '600 20px "Cormorant Garamond", Georgia, serif'
  ctx.fillText('Items', pad, y)
  y += 24

  for (const item of order.items) {
    const price = formatCents(item.item_price_cents * item.quantity)
    ctx.fillStyle = FOAM
    ctx.font = '500 15px Outfit, system-ui, sans-serif'
    const nameLines = wrapText(ctx, `${item.quantity}× ${item.item_name}`, contentW - 110)
    const priceWidth = ctx.measureText(price).width
    ctx.fillStyle = LEAF
    ctx.fillText(price, pad + contentW - priceWidth, y)
    ctx.fillStyle = FOAM
    for (let i = 0; i < nameLines.length; i++) {
      ctx.fillText(nameLines[i], pad, y + i * 20)
    }
    y += Math.max(28, nameLines.length * 20 + 8)
  }

  y += 8
  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(pad + contentW, y)
  ctx.stroke()
  y += 28

  // Total
  drawRoundedRect(ctx, pad, y, contentW, 64, 4)
  ctx.fillStyle = FOREST
  ctx.fill()
  ctx.strokeStyle = 'rgba(240, 193, 75, 0.45)'
  ctx.stroke()
  ctx.fillStyle = STEAM
  ctx.font = '500 12px Outfit, system-ui, sans-serif'
  ctx.fillText('TOTAL', pad + 20, y + 26)
  ctx.fillStyle = LEAF
  ctx.font = '600 28px "Cormorant Garamond", Georgia, serif'
  const total = formatCents(order.total_cents)
  ctx.fillText(total, pad + 20, y + 52)
  y += 88

  ctx.fillStyle = STEAM
  ctx.font = '500 13px Outfit, system-ui, sans-serif'
  ctx.fillText('No online payment — pay when you pick up.', pad, y)
  y += 28

  ctx.fillStyle = STEAM
  ctx.font = '500 11px Outfit, system-ui, sans-serif'
  ctx.fillText('TRACK YOUR ORDER', pad, y)
  y += 18
  ctx.fillStyle = LEAF
  ctx.font = '500 12px Outfit, system-ui, sans-serif'
  for (const line of wrapText(ctx, trackUrl, contentW)) {
    ctx.fillText(line, pad, y)
    y += 16
  }

  y += 20
  ctx.fillStyle = STEAM
  ctx.font = '500 12px Outfit, system-ui, sans-serif'
  ctx.fillText('Keep this token ID if you close the page.', pad, y)

  // Bottom gold rule
  ctx.fillStyle = LEAF
  ctx.fillRect(0, height - 4, width, 4)

  return canvas
}

/** Branded Maña Katha receipt PDF (logo + black/gold theme). */
export async function downloadOrderReceiptPdf(order: OrderWithItems): Promise<void> {
  const canvas = await renderReceiptCanvas(order)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.94)
  const binary = atob(dataUrl.split(',')[1] ?? '')
  const jpeg = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) jpeg[i] = binary.charCodeAt(i)

  const blob = buildJpegPdf(jpeg, canvas.width, canvas.height)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mana-katha-${order.tracking_token}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
