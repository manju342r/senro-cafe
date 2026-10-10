# CaféOS Known Limitations (MVP)

Honest list. Anything not here that fails is a bug — report it.

## Data & analytics

- **Contribution ≠ net profit.** Only ingredient costs are modelled; labour, rent,
  utilities, waste, and overhead are excluded (stated in the UI).
- **Seed recipe costs are demo values.** Replace quantities/costs with measured
  supplier data before trusting margins (`ingredients`, `recipe_ingredients`).
- **Per-item prep times are estimates.** Bottleneck analysis uses order-level
  timestamps; "most present in delayed orders" is co-occurrence, not causation.
- Analytics caps at 2000 orders per query (pagination is a follow-up).

## Ordering & realtime

- **Pay at counter only.** No online payments, no refunds flow.
- **Customer tracking polls every 4s** (real DB reads). Staff screens use
  Supabase Realtime. A signed tracking channel to replace polling is deferred.
- Cancellation is staff-side only, from received/accepted/preparing.
- One café, one menu, no multi-location or stock decrementing.

## AI & memory

- Without `GROQ_API_KEY`/`LLM_API_KEY`, narratives are rule-based templates
  (labelled in the UI). Stats underneath are live either way.
- Memory = `recommendations` tables, not Vectorize Hindsight
  (see `HINDSIGHT_STATUS.md` for the integration plan).
- Outcome evaluation is manual (mark implemented → re-run analysis);
  automatic before/after comparison is deferred.

## Auth & security

- Staff promotion is a manual SQL update (SETUP.md). No admin user-management UI.
- No rate limiting on order creation beyond idempotency keys; add Vercel/edge
  throttling before untrusted public launch.
- Unapplied migrations break new screens loudly (error states) rather than
  silently — apply 001 + 002 + seed per SETUP.md.
