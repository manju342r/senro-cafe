-- Senro CaféOS — Phase 1 foundation migration
-- Applies café operations tables ALONGSIDE existing Senro.AI tables (non-destructive).
-- Apply via Supabase Dashboard → SQL Editor, or: supabase db push (after supabase link)
-- Idempotent guards included where cheap (IF NOT EXISTS / DROP POLICY IF EXISTS).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------- profiles/roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup (default role: customer; promote staff in dashboard)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Staff helper (used by RLS; SECURITY DEFINER so anon checks can't enumerate)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  );
$$;

-- ---------------------------------------------------------------- menu
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL CHECK (price_cents > 0),
  prep_time_seconds INT NOT NULL DEFAULT 180 CHECK (prep_time_seconds >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  cost_per_unit_cents INT NOT NULL CHECK (cost_per_unit_cents >= 0),
  current_stock NUMERIC(10,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (menu_item_id, ingredient_id)
);

-- ---------------------------------------------------------------- orders
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'received', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE SEQUENCE IF NOT EXISTS cafe_order_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('C-' || nextval('cafe_order_seq')::TEXT),
  customer_name TEXT,
  status order_status NOT NULL DEFAULT 'received',
  total_cents INT NOT NULL CHECK (total_cents >= 0),
  tracking_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE,
  estimated_ready_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  -- Price/detail snapshot: later menu edits must not rewrite history
  item_name TEXT NOT NULL,
  item_price_cents INT NOT NULL CHECK (item_price_cents >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  customizations JSONB NOT NULL DEFAULT '{}',
  prep_time_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Atomic, race-safe status transition (row lock + legal-transition guard)
CREATE OR REPLACE FUNCTION public.transition_order(
  p_order_id UUID,
  p_to_status order_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row orders;
  v_from order_status;
  v_allowed BOOLEAN := FALSE;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'P0002';
  END IF;
  v_from := v_row.status;

  v_allowed :=
    (v_from = 'received'  AND p_to_status IN ('accepted', 'cancelled')) OR
    (v_from = 'accepted'  AND p_to_status IN ('preparing', 'cancelled')) OR
    (v_from = 'preparing' AND p_to_status IN ('ready', 'cancelled')) OR
    (v_from = 'ready'     AND p_to_status IN ('completed')) OR
    (v_from = p_to_status);

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'illegal_transition: % -> %', v_from, p_to_status USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orders SET
    status = p_to_status,
    accepted_at  = CASE WHEN p_to_status = 'accepted'  THEN NOW() ELSE accepted_at END,
    preparing_at = CASE WHEN p_to_status = 'preparing' THEN NOW() ELSE preparing_at END,
    ready_at     = CASE WHEN p_to_status = 'ready'     THEN NOW() ELSE ready_at END,
    completed_at = CASE WHEN p_to_status = 'completed' THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_to_status = 'cancelled' THEN NOW() ELSE cancelled_at END,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_row;

  INSERT INTO public.order_status_events (order_id, from_status, to_status, changed_by, notes)
  VALUES (p_order_id, v_from, p_to_status, auth.uid(), p_notes);

  RETURN v_row;
END $$;

-- Customer order lookup by unguessable token (avoids spoofable RLS settings)
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order orders;
  v_items JSONB;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE tracking_token = p_token;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(oi) ORDER BY oi.created_at), '[]'::JSONB)
    INTO v_items FROM public.order_items oi WHERE oi.order_id = v_order.id;
  RETURN jsonb_build_object('order', to_jsonb(v_order), 'items', v_items);
END $$;

-- ---------------------------------------------------------------- AI memory
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]',
  metrics JSONB,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'rejected', 'implemented', 'evaluated')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  query_params JSONB NOT NULL DEFAULT '{}',
  result_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  actual_metrics JSONB NOT NULL DEFAULT '{}',
  expected_metrics JSONB NOT NULL DEFAULT '{}',
  variance_pct NUMERIC,
  notes TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------- indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_cat_avail ON menu_items(category_id, is_available);
CREATE INDEX IF NOT EXISTS idx_recipe_item ON recipe_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_idem ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_status_events_order ON order_status_events(order_id, created_at);

-- ---------------------------------------------------------------- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_outcomes ENABLE ROW LEVEL SECURITY;

-- profiles: users read own; staff read all; users update own display_name only
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id OR public.is_staff());
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- menu: anyone (incl. anon) reads active categories + available items
DROP POLICY IF EXISTS "cats_public_read" ON menu_categories;
CREATE POLICY "cats_public_read" ON menu_categories FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "cats_staff_all" ON menu_categories;
CREATE POLICY "cats_staff_all" ON menu_categories FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "items_public_read" ON menu_items;
CREATE POLICY "items_public_read" ON menu_items FOR SELECT USING (is_available = TRUE);
DROP POLICY IF EXISTS "items_staff_all" ON menu_items;
CREATE POLICY "items_staff_all" ON menu_items FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- costs: staff only (customers must never see ingredient costs)
DROP POLICY IF EXISTS "ingredients_staff" ON ingredients;
CREATE POLICY "ingredients_staff" ON ingredients FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "recipes_staff_read" ON recipe_ingredients;
CREATE POLICY "recipes_staff_read" ON recipe_ingredients FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "recipes_staff_write" ON recipe_ingredients;
CREATE POLICY "recipes_staff_write" ON recipe_ingredients FOR INSERT WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "recipes_staff_update" ON recipe_ingredients;
CREATE POLICY "recipes_staff_update" ON recipe_ingredients FOR UPDATE USING (public.is_staff());
DROP POLICY IF EXISTS "recipes_staff_delete" ON recipe_ingredients;
CREATE POLICY "recipes_staff_delete" ON recipe_ingredients FOR DELETE USING (public.is_staff());

-- orders: anon/authenticated can INSERT (pay-at-counter, no login required);
-- reads go through get_order_by_token RPC; staff have full access
DROP POLICY IF EXISTS "orders_public_insert" ON orders;
CREATE POLICY "orders_public_insert" ON orders FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "orders_staff_all" ON orders;
CREATE POLICY "orders_staff_all" ON orders FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "order_items_public_insert" ON order_items;
CREATE POLICY "order_items_public_insert" ON order_items FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "order_items_staff_all" ON order_items;
CREATE POLICY "order_items_staff_all" ON order_items FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "events_staff_read" ON order_status_events;
CREATE POLICY "events_staff_read" ON order_status_events FOR SELECT USING (public.is_staff());

-- AI tables: staff only
DROP POLICY IF EXISTS "recs_staff" ON recommendations;
CREATE POLICY "recs_staff" ON recommendations FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "recev_staff" ON recommendation_evidence;
CREATE POLICY "recev_staff" ON recommendation_evidence FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "recout_staff" ON recommendation_outcomes;
CREATE POLICY "recout_staff" ON recommendation_outcomes FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------- realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE order_status_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
