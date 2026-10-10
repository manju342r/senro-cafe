# Mana Katha — local setup

## Quick start (demo mode)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

No Supabase keys required. Orders and menu state live in `localStorage`.

## Routes

| Path | Who |
|------|-----|
| `/` | Brand home |
| `/menu` `/cart` `/orders/:token` | Customer ordering |
| `/about` `/visit` | Story + hours |
| `/staff/login` | Password `staff` or `demo` |
| `/staff/orders` `/staff/menu` `/staff/analytics` `/staff/ai` | Floor tools |

## Supabase (optional later)

1. Create a project and run [`supabase/schema.sql`](supabase/schema.sql).
2. Copy `.env.example` → `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Client wiring is the next integration step; the hackathon demo is fully offline-capable.
