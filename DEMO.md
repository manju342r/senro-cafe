# Mana Katha — 3-minute demo script

**Pitch line:** Mana Katha is a neighborhood cafe whose website is also its operating system — customer order + staff floor + profit insight on one stack.

## Setup (30s)

```bash
npm install && npm run dev
```

Open two windows: customer `http://localhost:5173` and staff `http://localhost:5173/staff/login` (password `staff`).

## Script

### 1. Brand (20s)

- Land on `/` — **Mana Katha** is the hero, not a dashboard.
- Click **Order now** → menu with INR prices, sold-out Mirchi Bajji visible.

### 2. Customer order (45s)

- Add Filter Coffee + Ghee Roast Dosa → Cart → name “Judge” → **Place order**.
- Show tracking timeline at `received`. Keep this tab open.

### 3. Staff floor (60s)

- Staff login → Live queue shows Judge’s ticket.
- **Accept** → **Start prep** → **Mark ready**.
- Flip customer tab — status updates without refresh (same browser store + subscription).
- Optional: Menu → mark an item **Sold out** → customer menu reflects it.

### 4. Profit + AI (45s)

- Complete the order on staff.
- **Analytics** — contribution table; Mysore Pak shows **Cost data incomplete**.
- **AI** → preset “What’s our worst margin item during lunch?” → evidence IDs + metrics.

### 5. Close (10s)

- Pay-at-counter only (honest MVP). Production path: Supabase schema + RLS in repo.

## Talking points

- Dual interface, one data model
- Idempotent order create + legal status transitions
- Charts/AI bound to real demo queries, not decorative
