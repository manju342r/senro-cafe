# CaféOS Deployment

## Services

- Frontend + serverless API: Vercel (this repo, `vercel.json` SPA rewrites already in place).
- Database + Auth + Realtime: Supabase project **Senro.AI** (`cwsndwhjuevsbcshppyl`, ap-northeast-2).

## Database setup (required once)

In Supabase Dashboard → SQL Editor, run in order:

1. `supabase/migrations/001_cafeos.sql` — tables, RLS, `transition_order()`, `get_order_by_token()`, realtime.
2. `supabase/migrations/002_cafeos_order_rpc.sql` — `create_order()` RPC.
3. `supabase/migrations/003_security_hardening.sql` — role-escalation fix, RPC-only order writes.
3. `supabase/seed.sql` — demo menu (verify: `SELECT count(*) FROM menu_items;` → 10).

Promote staff: sign up in-app, then
`UPDATE profiles SET role = 'staff' WHERE id = '<auth-user-uuid>';`

## Environment variables (Vercel → Settings → Environment Variables)

Browser (build-time): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Server-only: `SUPABASE_SERVICE_ROLE_KEY` (reserved for future admin ops),
`GROQ_API_KEY` or `LLM_API_KEY` (AI narrative; AI works rule-based without it),
`HINDSIGHT_API_KEY`, `RESEND_API_KEY` (both optional, currently unused).

Redeploy after changing server vars. Never prefix server secrets with `VITE_`.

## Deploy

```bash
npm run build        # must pass (tsc -b runs inside)
vercel --prod        # or push to main if Git-connected
```

## Rollback

- Code: revert the commit, redeploy.
- Data: migrations are additive (no drops); `002` replaces only `create_order()`.
  RLS denies anon reads on orders/costs by default, so a bad deploy leaks nothing new.
