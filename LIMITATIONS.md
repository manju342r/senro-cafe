# Mana Katha — known limitations (MVP)

Honesty for judges and operators:

1. **Demo data store** — menu/orders live in `localStorage`, not a shared multi-device backend yet. Two browsers on the same machine share data; different devices do not.
2. **No online payments** — pay at counter only (no Razorpay/UPI).
3. **No table reservations** or loyalty accounts.
4. **Staff auth** — shared demo password, not Supabase JWT + RLS in the running app.
5. **AI** — deterministic tools over demo data (no external LLM). Designed so a real model can only call allowlisted tools server-side later.
6. **Visit page** — placeholder address/hours/map until real cafe details are provided.
7. **Menu seed** — placeholder South-Indian cafe menu; swap for the real Mana Katha menu when available.
8. **Supabase** — [`supabase/schema.sql`](supabase/schema.sql) is ready; client integration is not wired in this build.

What is real: end-to-end order loop, status audit trail, contribution math from recipes, sold-out sync, evidence-backed staff insights.
