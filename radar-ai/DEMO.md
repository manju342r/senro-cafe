# CaféOS 3-Minute Demo Script

All data below is real — created live through the app during the demo.

## 0:00–0:45 — Customer orders (phone viewport, `/menu`)

1. Open `/menu`. Categories + prices load from the database.
2. Add a Cappuccino and a Club Sandwich → Cart badge counts up.
3. Open cart, add note "less sugar", enter a pickup name, **Place order**.
4. Land on `/orders/<token>`: order number (e.g. `C-1001`), status **Received**, wait estimate.

## 0:45–1:30 — Staff fulfills (desktop, `/staff/orders`)

1. Sign in as staff. The new order is already at the top — no refresh
   (Supabase Realtime; point out the Active/Delayed/Median-wait cards).
2. Open the order, walk it Received → Accepted → Preparing → Ready.
3. Flip back to the customer page: status + progress steps advanced.

## 1:30–2:15 — Profit intelligence (`/staff/analytics`)

1. Last-7-days filter: revenue, contribution, units cards.
2. Contribution table: margin per item from recorded prices + recipe costs.
3. Point at one "unknown" cost row: missing data is labelled, never zeroed.
4. Rush-hours bars: volume + median prep per hour from real order timestamps.

## 2:15–3:00 — AI agent (`/staff/ai`)

1. **Run analysis**: findings computed from the same stats just shown.
2. Open a recommendation: evidence + proposed experiment + success metrics.
3. **Approve** it — decision + timestamp recorded; history persists for the
   next run (memory = `recommendations` rows, see `HINDSIGHT_STATUS.md`).

## Fallback lines (if live data is thin)

- "Seed provides 10 items; orders you place now feed every number on screen."
- "No LLM key on this deploy, so the narrative is rule-based — the stats underneath are still live queries."
