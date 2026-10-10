<!-- /autoplan restore point: "/Users/manjunathchakri/.gstack/projects/manjunathchakri/main-autoplan-restore-20261010-095418.md" -->
## Implementation plan
# Senro CaféOS - Implementation Plan

## Executive Summary

This plan transforms the existing `radar-ai` competitive intelligence platform into **Senro CaféOS** — an AI-powered café operations and profit intelligence platform with separate customer and staff interfaces connected to a shared backend.

**Current State**: A competitive intelligence platform (Senro.AI) with React/Vite/TypeScript, Supabase, Hindsight memory, and real-time capabilities.
**Target State**: A café operations platform with customer ordering, staff dashboard, profit analytics, and AI intelligence agent.

---

## 1. Repository Assessment

### 1.1 Existing Assets (Reusable)

| Asset | Location | Reusability | Notes |
|-------|----------|-------------|-------|
| **Frontend Stack** | `radar-ai/` | ✅ High | React 18, TypeScript, Vite, Tailwind CSS v4, React Router, Framer Motion, Recharts |
| **Supabase Client** | `radar-ai/src/contexts/DataContext.tsx` | ✅ High | Auth, RLS patterns, real-time subscriptions |
| **API Routes** | `radar-ai/api/` | ⚠️ Partial | Scraping logic not needed; AI analysis patterns reusable |
| **Hindsight Integration** | `radar-ai/src/services/hindsightAgent.ts` | ⚠️ Mocked | Interface exists but implementation is simulated; needs real Vectorize Hindsight SDK |
| **Database Schema** | `radar-ai/supabase/schema.sql` | ❌ Replace | Entirely different domain (competitors vs café operations) |
| **UI Components** | `radar-ai/src/components/` | ⚠️ Partial | MetricCard, charts, layouts reusable; domain components need rebuild |
| **Authentication** | `radar-ai/src/pages/AuthScreen.tsx` | ✅ High | Supabase Auth patterns reusable |
| **Deployment Config** | `radar-ai/vercel.json` | ✅ High | Vercel + Supabase deployment pattern reusable |

### 1.2 Missing / To Build

| Component | Priority | Effort |
|-----------|----------|--------|
| **New Database Schema** (orders, menu, ingredients, recipes, analytics) | P0 | High |
| **Customer App** (menu browsing, cart, order tracking) | P0 | High |
| **Staff Dashboard** (live queue, menu management, analytics) | P0 | High |
| **Profit Intelligence Engine** (contribution margins, rush-hour analysis) | P0 | High |
| **AI Intelligence Agent** (secure tools, evidence-backed recommendations) | P0 | High |
| **Real Hindsight Integration** (Vectorize SDK) | P1 | Medium |
| **Role-Based Access Control** (customer vs staff) | P0 | Medium |
| **Real-time Order Sync** (Supabase Realtime) | P0 | Medium |

---

## 2. Technical Architecture

### 2.1 Stack (Preserve Existing)

```
Frontend:     React 18 + TypeScript + Vite + Tailwind CSS v4
Backend:      Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
Real-time:    Supabase Realtime (order status, queue updates)
Auth:         Supabase Auth (email/password + magic links)
AuthZ:        Server-side role checks + PostgreSQL RLS
AI:           Configurable LLM provider (server-side only)
Memory:       Vectorize Hindsight (if SDK available; otherwise plan for integration)
Deployment:   Vercel (frontend) + Supabase (backend)
```

### 2.2 Route Structure

```
/                          → Redirect to /menu
/menu                      → Customer menu browsing
/menu/:category            → Filtered menu
/cart                      → Cart & checkout
/orders/:orderId           → Customer order tracking (public, unguessable token)
/staff/login               → Staff authentication
/staff/orders              → Live order queue
/staff/orders/:id          → Order detail & status management
/staff/menu                → Menu management (CRUD)
/staff/analytics           → Profit intelligence & rush-hour analysis
/staff/ai                  → AI Intelligence Agent interface
```

### 2.3 Database Design (New Schema)

```sql
-- Core: Profiles & Roles
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
ALTER TABLE auth.users ADD COLUMN role user_role DEFAULT 'customer';

-- Menu
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL CHECK (price_cents > 0),
  prep_time_seconds INT DEFAULT 180,
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients & Recipes (for cost tracking)
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL, -- 'g', 'ml', 'pcs', 'oz'
  cost_per_unit_cents INT NOT NULL CHECK (cost_per_unit_cents >= 0),
  current_stock DECIMAL(10,3) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (menu_item_id, ingredient_id)
);

-- Orders
CREATE TYPE order_status AS ENUM (
  'received', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  status order_status DEFAULT 'received',
  total_cents INT NOT NULL,
  tracking_token TEXT NOT NULL UNIQUE, -- unguessable for customer access
  estimated_ready_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  -- Preserve price & details at time of order
  item_name TEXT NOT NULL,
  item_price_cents INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  customizations JSONB DEFAULT '{}',
  prep_time_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status audit trail
CREATE TABLE order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Intelligence Memory
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'pricing', 'prep_optimization', 'menu_engineering', 'bundle'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB NOT NULL, -- structured evidence supporting recommendation
  metrics JSONB, -- expected impact: { contribution_per_order: 500, prep_time_reduction_pct: 15 }
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'implemented', 'evaluated')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recommendation_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'sales_data', 'prep_time_analysis', 'queue_analysis', 'cost_analysis'
  query_params JSONB NOT NULL,
  result_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recommendation_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  actual_metrics JSONB NOT NULL,
  expected_metrics JSONB NOT NULL,
  variance_pct NUMERIC,
  notes TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_status_events_order ON order_status_events(order_id, created_at);
CREATE INDEX idx_menu_items_category_available ON menu_items(category_id, is_available);
CREATE INDEX idx_recipe_ingredients_item ON recipe_ingredients(menu_item_id);
```

### 2.4 Row Level Security Policies

```sql
-- Customers: own orders only (via tracking_token)
CREATE POLICY "Customers read own orders" ON orders
  FOR SELECT USING (tracking_token = current_setting('app.current_tracking_token', true));

-- Staff: all orders
CREATE POLICY "Staff read all orders" ON orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('staff','admin')
  ));

-- Staff: manage menu
CREATE POLICY "Staff manage menu" ON menu_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('staff','admin')
  ));

-- Customers: read available menu
CREATE POLICY "Customers read menu" ON menu_items
  FOR SELECT USING (is_available = true);

-- Ingredients/Recipes: staff only
CREATE POLICY "Staff manage ingredients" ON ingredients
  FOR ALL USING (EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('staff','admin')
  ));

-- Recommendations: staff only
CREATE POLICY "Staff manage recommendations" ON recommendations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('staff','admin')
  ));
```

---

## 3. Phased Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal**: Database, auth, roles, and core infrastructure ready.

| Task | Deliverable | Acceptance Criteria |
|------|-------------|---------------------|
| 1.1 Create new Supabase schema | `supabase/schema.sql` | All tables, indexes, RLS policies created; migrations run |
| 1.2 Configure Supabase Auth | Auth settings | Email/password + magic link enabled; role claim in JWT |
| 1.3 Set up environment variables | `.env.example` | All required vars documented |
| 1.4 Create shared Supabase client | `src/lib/supabase.ts` | Single client with auth helpers |
| 1.5 Create TypeScript types | `src/types/database.ts` | Full type coverage for all tables |
| 1.6 Set up API route structure | `api/` folder | Edge Functions for orders, menu, analytics, AI |
| 1.7 Configure Vercel deployment | `vercel.json` | Preview + production deployments work |

**Verification**: Run migrations against fresh Supabase project; verify RLS with test users.

---

### Phase 2: Core Ordering (Week 1-2)
**Goal**: End-to-end customer order flow working.

| Task | Deliverable | Acceptance Criteria |
|------|-------------|---------------------|
| 2.1 Menu API | `GET /api/menu`, `GET /api/menu/:id` | Returns categorized menu with availability |
| 2.2 Customer Menu UI | `/menu` page | Browse categories, view items, see availability |
| 2.3 Cart State Management | `src/contexts/CartContext.tsx` | Add/remove/update quantities; persist to localStorage |
| 2.4 Cart UI | `/cart` page | Review items, adjust quantities, enter name |
| 2.5 Order Creation API | `POST /api/orders` | Creates order + order_items atomically; returns tracking_token |
| 2.6 Order Status API | `GET /api/orders/:trackingToken` | Returns order with items and status |
| 2.7 Customer Order Tracking | `/orders/:trackingToken` page | Real-time status updates via Supabase Realtime |
| 2.8 Estimated Wait Time | Calculation logic | Based on queue position × avg prep time per status |
| 2.9 Status Transition API | `PATCH /api/orders/:id/status` | Validates transitions; records audit event |

**Order Status Transitions** (validated server-side):
```
received → accepted → preparing → ready → completed
                ↘ cancelled (from received/accepted/preparing)
```

**Verification**: Place test order via UI → appears in DB → status transitions work → customer sees real-time updates.

---

### Phase 3: Staff Operations (Week 2)
**Goal**: Staff can manage live orders and menu.

| Task | Deliverable | Acceptance Criteria |
|------|-------------|---------------------|
| 3.1 Staff Auth Guard | `src/components/StaffRoute.tsx` | Redirects non-staff to login |
| 3.2 Live Order Queue | `/staff/orders` page | Real-time list; auto-refresh; highlight overdue |
| 3.3 Order Detail Modal | Click order in queue | Show items, customizations, timeline, status actions |
| 3.4 Status Actions | Buttons per valid transition | Accept, Start Prep, Mark Ready, Complete, Cancel |
| 3.5 Prep Time Tracking | Auto-timestamp on transitions | `accepted_at`, `preparing_at`, `ready_at` populated |
| 3.6 Queue Statistics | Header cards | Active count, avg prep time, overdue count |
| 3.7 Menu Management | `/staff/menu` page | CRUD items, toggle availability, set prices |
| 3.8 Ingredient Management | `/staff/ingredients` page | CRUD ingredients, set costs, view stock |

**Verification**: Staff logs in → sees live orders → advances status → customer sees update instantly.

---

### Phase 4: Profit Analytics (Week 2-3)
**Goal**: Real contribution margins and rush-hour intelligence from actual data.

| Task | Deliverable | Acceptance Criteria |
|------|-------------|---------------------|
| 4.1 Cost Calculation Engine | `src/lib/profit.ts` | `calculateItemCost(menuItemId)` sums recipe_ingredients × ingredient costs |
| 4.2 Contribution Margin API | `GET /api/analytics/contribution` | Per-item: price, cost, contribution, units sold, total contribution |
| 4.3 Date/Category Filters | Query params | `?from=2026-01-01&to=2026-01-31&category=drinks` |
| 4.4 Missing Cost Handling | Explicit UI | Items without full recipe show "Cost data incomplete" not $0 |
| 4.5 Sales Analytics UI | `/staff/analytics` page | Table + charts (Recharts) for contribution, revenue, volume |
| 4.6 Rush-Hour Analysis | `GET /api/analytics/rush-hour` | Hourly order volume, prep time by hour, queue buildup detection |
| 4.7 Bottleneck Identification | Algorithm | Items where `prep_time > p90` AND `volume > median` during peak hours |
| 4.8 Rush-Hour UI | Dashboard section | Heatmap of volume, prep time trends, bottleneck alerts |

**Verification**: Insert test orders with known costs → analytics match manual calculations.

---

### Phase 5: AI Intelligence & Memory (Week 3)
**Goal**: AI agent queries real data, produces evidence-backed recommendations, uses Hindsight.

| Task | Deliverable | Acceptance Criteria |
|------|-------------|---------------------|
| 5.1 AI Tools (Server-Side) | `api/ai/tools/` | `queryContribution()`, `queryPrepTimes()`, `queryRushHour()`, `queryRecommendations()` |
| 5.2 Tool Authorization | Middleware | Validates staff JWT; rejects customer tokens |
| 5.3 AI Agent Endpoint | `POST /api/ai/analyze` | Accepts prompt, calls tools, returns structured recommendation |
| 5.4 Recommendation Schema | JSON format | `{ type, title, description, evidence[], metrics, confidence }` |
| 5.5 Hindsight Integration | `src/services/hindsight.ts` | Real Vectorize SDK (if available) or documented integration plan |
| 5.6 Memory Write | On recommendation creation | Store observation + evidence in Hindsight |
| 5.7 Memory Read | Before new analysis | Recall relevant history for context |
| 5.8 Outcome Evaluation | `POST /api/ai/evaluate` | Compares actual vs expected after implementation period |
| 5.9 Staff AI Interface | `/staff/ai` page | Chat-like UI showing recommendations, evidence, approve/reject |

**AI Tool Contracts** (server-side only, never exposed to browser):
```typescript
interface AITools {
  queryContribution: (filters: { from: Date; to: Date; category?: string }) => Promise<ContributionData[]>;
  queryPrepTimes: (filters: { from: Date; to: Date; itemIds?: string[] }) => Promise<PrepTimeData[]>;
  queryRushHour: (filters: { from: Date; to: Date }) => Promise<RushHourData>;
  queryRecommendations: (status?: string) => Promise<Recommendation[]>;
  createRecommendation: (rec: Omit<Recommendation, 'id'|'created_at'>) => Promise<Recommendation>;
}
```

**Verification**: Ask agent "What's our worst margin item during lunch?" → returns data-backed answer with evidence citations.

---

### Phase 6: Verification & Hardening (Week 3-4)
**Goal**: Production-ready, tested, secure.

| Task | Deliverable | Acceptance Criteria |
|------|-------------|---------------------|
| 6.1 Integration Tests | `tests/integration/` | Full order flow: customer → staff → customer |
| 6.2 AuthZ Tests | Test RLS policies | Customers cannot read staff data; staff cannot impersonate |
| 6.3 Concurrency Tests | Simulate concurrent status updates | No lost updates; valid transitions only |
| 6.4 Idempotency | Order creation | Duplicate submissions create single order |
| 6.5 Error Boundary UI | Friendly error pages | Network errors, auth failures, validation errors |
| 6.6 Load Test | 100 concurrent orders | <500ms p95 API latency; no deadlocks |
| 6.7 Accessibility Audit | WCAG 2.1 AA | Color contrast, keyboard nav, screen readers |
| 6.8 Security Review | Checklist | No secrets in client; RLS enforced; input validation |

---

### Phase 7: Deployment & Demo (Week 4)
**Goal**: Deployed, documented, demo-ready.

| Task | Deliverable | Acceptance Criteria |
|------|-------------|---------------------|
| 7.1 Production Supabase | Live project | Migrations applied; RLS verified; Realtime enabled |
| 7.2 Vercel Production | Live URL | `senro-cafeos.vercel.app` accessible |
| 7.3 Environment Docs | `DEPLOYMENT.md` | All env vars, setup steps, troubleshooting |
| 7.4 Database Seeding | `supabase/seed.sql` | Demo data: 10 menu items, 5 ingredients, sample orders |
| 7.5 Demo Script | `DEMO.md` | 3-min script: customer order → staff fulfill → analytics → AI |
| 7.6 Known Limitations | `LIMITATIONS.md` | Honest list of MVP constraints |

---

## 4. Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hindsight SDK unavailable/incompatible | High | Medium | Build fallback: local vector store (pgvector) + simple recall; document integration plan |
| Real-time sync complexity | Medium | High | Use Supabase Realtime broadcasts for order status; test thoroughly |
| Contribution margin accuracy | Medium | High | Require recipe_ingredients for cost calc; flag incomplete data explicitly |
| AI prompt injection | Low | Critical | Server-side tools only; strict input validation; no raw SQL from LLM |
| Scope creep | High | Medium | Freeze scope at Phase 3; defer nice-to-haves to post-hackathon |
| Supabase Realtime limits | Low | Medium | Batch updates; use presence for staff online status only |

---

## 5. Definition of Done (MVP)

The MVP is **complete** only when all 10 criteria are met:

1. ✅ Customer browses live menu and places real database-backed order
2. ✅ Order appears on staff dashboard without manual refresh
3. ✅ Staff updates order status; customer sees update in real-time
4. ✅ System computes contribution margins from recorded prices and ingredient costs
5. ✅ Rush-hour metrics derive from actual order_status_events timestamps
6. ✅ AI agent inspects real data and produces traceable recommendations with evidence
7. ✅ Historical memory (Hindsight or fallback) retrieves and informs subsequent analyses
8. ✅ Security policies prevent unauthorized access (RLS + server-side checks verified)
9. ✅ Core tests pass; deployed application works end-to-end
10. ✅ Documentation describes limitations, setup, and required environment variables

---

## 6. Recommended Starting Point

**Immediate next steps** (can begin today):

1. **Create new Supabase project** for CaféOS (separate from radar-ai)
2. **Run schema migration** (Phase 1.1)
3. **Set up local dev environment** with new `.env` pointing to new Supabase
4. **Build shared Supabase client + types** (Phase 1.4-1.5)
5. **Implement Menu API + Customer Menu UI** (Phase 2.1-2.2)

**Defer to post-MVP**:
- Online payments (Stripe)
- Multi-location support
- Advanced inventory (waste tracking, auto-reorder)
- Customer loyalty/accounts
- Native mobile apps
- Kitchen display system (KDS) integration

---

## 7. File Structure (Target)

```
senro-cafeos/
├── api/
│   ├── menu.ts              # GET menu, categories
│   ├── orders.ts            # POST create, GET status, PATCH status
│   ├── analytics.ts         # GET contribution, rush-hour
│   ├── ai/
│   │   ├── analyze.ts       # POST AI analysis
│   │   ├── evaluate.ts      # POST outcome evaluation
│   │   └── tools/           # Server-side AI tools
│   └── staff/
│       ├── menu.ts          # CRUD menu items
│       └── ingredients.ts   # CRUD ingredients
├── supabase/
│   ├── schema.sql           # Complete schema (this plan)
│   ├── seed.sql             # Demo data
│   └── migrations/          # Numbered migration files
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Shared client
│   │   ├── profit.ts        # Cost/contribution calculations
│   │   └── hindsight.ts     # Memory integration
│   ├── types/
│   │   └── database.ts      # Generated from schema
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Supabase auth + role
│   │   └── CartContext.tsx  # Customer cart state
│   ├── components/
│   │   ├── ui/              # Reusable: Button, Card, Input, Modal, etc.
│   │   ├── customer/        # Menu, Cart, OrderTracking
│   │   ├── staff/           # OrderQueue, MenuManager, Analytics, AIChat
│   │   └── shared/          # Layout, Header, StatusBadge, Loading
│   ├── pages/
│   │   ├── customer/
│   │   │   ├── Menu.tsx
│   │   │   ├── Cart.tsx
│   │   │   └── OrderTracking.tsx
│   │   └── staff/
│   │       ├── Login.tsx
│   │       ├── Orders.tsx
│   │       ├── Menu.tsx
│   │       ├── Analytics.tsx
│   │       └── AI.tsx
│   ├── hooks/
│   │   ├── useRealtimeOrders.ts
│   │   ├── useMenu.ts
│   │   └── useAnalytics.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── vercel.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── DEPLOYMENT.md
├── DEMO.md
├── LIMITATIONS.md
└── IMPLEMENTATION_PLAN.md  (this file)
```

---

## 8. Approval Request

**Please review this plan and confirm:**

1. ✅ Use `radar-ai` as the base (rename/refactor) vs. fresh scaffold?
2. ✅ Target stack: React/Vite/Tailwind/Supabase (as specified)?
3. ✅ Hindsight: attempt real Vectorize SDK; fallback to pgvector if unavailable?
4. ✅ Pay-at-counter only for MVP (no Stripe)?
5. ✅ Phase 1-3 as minimum viable demo (Phases 4-5 stretch)?
6. ✅ Single Supabase project for both customer + staff data?

**Once approved, I'll begin Phase 1 implementation.**

---

## GSTACK REVIEW REPORT (autoplan compressed run, 2026-10-10)

> Mode: SELECTIVE EXPANSION (hold scope + cherry-pick). Outside Codex voice +
> snapshot packet ceremony skipped (no Codex CLI in this host, plan file predates
> `## Implementation plan` / `## Review record` packet structure); native inline
> review ran CEO → Design → DX → Eng sequentially at full depth. Re-run full
> `/autoplan` before ship to get packet hashes + outside voice.

### CEO review
- Premise upheld: reuse `radar-ai` stack/patterns (Auth, Tailwind tokens,
  `DashboardLayout` shell, serverless `api/` pattern), NOT its domain code.
  Build fresh café route tree alongside; hide competitor pages at the end.
- 10-star lever is the closed-loop experiment (recommend → approve → measure).
  Keep it; demo needs one seeded lunch-rush story, not a generic dashboard.
- 7 phases / 4 weeks overshoots hackathon time. Selective cut: P1–P3 must-ship,
  P4 minimal (contribution table + filters, no heatmap), P5 minimal (one AI
  endpoint, 3 read tools + create, eval via query not UI), P6 cut to
  authZ + idempotency + transition tests, P7 kept.
- Alternatives rejected: Next.js rewrite (cost, no SSR need), split repos
  (violates shared-backend requirement). pgvector fallback for Hindsight accepted.

### Design review (UI scope: yes)
- Reuse `liquid-glass` + Tailwind v4 tokens; bento grid for analytics only.
- Required per-route state inventory: loading / empty / error / success for
  `/menu`, `/cart`, `/orders/:token`, `/staff/orders`, `/staff/analytics`.
- Queue card spec: order no, items×qty, customizations, age, status pill;
  overdue = `now - created_at > est_prep`, amber→red. Status timeline component
  on tracking page. No decorative charts: every chart binds to a DB query.
- Accessibility: contrast AA, keyboard cart/checkout, 44px touch targets.

### DX review (dxRequired: true)
- TTHW target ≤15 min: `SETUP.md` quickstart (new Supabase project → migrate →
  seed → `.env` → `vite dev`), single `supabase/seed.sql` with 10 items +
  5 ingredients + 20 lunch-rush orders via real order API.
- `.env.example` must separate `VITE_*` (anon URL/key only) from server keys
  (service-role, GROQ/LLM, Hindsight, Resend) with a never-expose warning.
- AI tool contracts (already in §Phase 5) kept as the server-only DX surface.

### Eng review (last, governs)
- Keep Vite SPA + `api/*.js` + Supabase. Replace
  `current_setting('app.current_tracking_token')` RLS with token-equality RPC /
  service-role API check (client-set settings are spoofable).
- Add `transition_order()` DB function with row lock + legal-transition guard;
  `idempotency_key UNIQUE`; price snapshot on `order_items` (already planned).
- Explicit `ALTER PUBLICATION supabase_realtime ADD TABLE orders,
  order_status_events`.
- LLM guard: allowlisted tool args, staff-JWT check, no raw SQL from model,
  evidence IDs required on every recommendation.
- Hindsight: probe Vectorize SDK first; fallback = `recommendation_*` tables,
  documented in `HINDSIGHT_STATUS.md`. No fake recall.
- Tests for MVP: RLS probe, double-submit idempotency, racing transitions,
  contribution-math vs direct SQL. Defer 100-order load test.

<!-- autoplan-accepted:ceo -->
- Selective scope: P1–P3 must-ship; P4 contribution table + filters only (heatmap deferred); P5 one AI endpoint with 3 read tools + create, eval via query; P6 authZ + idempotency + transition tests only; P7 kept. Verify each phase gate before next.
<!-- /autoplan-accepted:ceo -->
<!-- autoplan-accepted:design -->
- Per-route loading/empty/error/success states; queue card with SLA overdue rule (`age > est_prep`); status timeline on tracking page; charts only from DB queries; AA contrast + keyboard + touch targets.
<!-- /autoplan-accepted:design -->
<!-- autoplan-accepted:dx -->
- SETUP.md ≤15-min quickstart; seed.sql via real order path; .env.example split client/server keys with never-expose warning; server-only AI tool contracts.
<!-- /autoplan-accepted:dx -->
<!-- autoplan-accepted:eng -->
- Token RPC/service-role check (no client-set RLS setting); transition_order() with lock + guard; realtime on orders + status events; LLM allowlist + staff-JWT + evidence IDs; Hindsight probe then pgvector-table fallback; MVP test list (RLS, idempotency, races, math).
<!-- /autoplan-accepted:eng -->
## Review record
