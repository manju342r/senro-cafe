# CaféOS Setup (≤15 min)

## 1. Apply the database migration (2 min)

The CLI is not linked to the Supabase project (needs the DB password),
so apply via Dashboard:

1. Open Supabase Dashboard → project **Senro.AI** → SQL Editor.
2. Paste and run `supabase/migrations/001_cafeos.sql` (café tables live
   alongside existing Senro.AI tables; nothing is dropped).
3. Paste and run `supabase/migrations/002_cafeos_order_rpc.sql` (`create_order()` RPC).
4. Paste and run `supabase/migrations/003_security_hardening.sql` (role lockdown, RPC-only writes).
4. Paste and run `supabase/seed.sql` (3 categories, 10 items, 5 ingredients).
5. Verify: `SELECT count(*) FROM menu_items;` → 10 rows.

To link the CLI instead (optional): `supabase link --project-ref
cwsndwhjuevsbcshppyl` (needs DB password), then `supabase db push`.

## 2. Promote a staff user (1 min)

1. Sign up in the app (or Supabase Auth) with the staff member's email.
2. SQL Editor: `UPDATE profiles SET role = 'staff' WHERE id = '<auth-user-uuid>';`
3. First staff login should be an `admin`; further promotions via app later.

## 3. Environment (2 min)

```bash
cp .env.example .env   # then fill in
```

- Browser-safe: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only.
- Server-only (Vercel env vars, never `VITE_` prefixed): `SUPABASE_SERVICE_ROLE_KEY`,
  `GROQ_API_KEY` (or `LLM_API_KEY`), `HINDSIGHT_API_KEY`, `RESEND_API_KEY`.

## 4. Run

```bash
npm install
npm run dev        # typecheck: npx tsc -b ; build: npm run build
```

## 5. Verify Phase 1

- [ ] `menu_items` returns 10 available items to anon clients.
- [ ] `ingredients` is denied to anon (RLS), readable as staff.
- [ ] New signup creates a `profiles` row with role `customer`.
- [ ] `npx tsc -b` passes; `npm run build` succeeds.

## Known limitations (Phase 1)

- Migration is applied manually until CLI link exists.
- Customer order pages (Phase 2) not built yet; `get_order_by_token` RPC is
  ready but has no UI caller.
- Hindsight SDK not yet probed (Phase 5); memory = `recommendation_*` tables.
