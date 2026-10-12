-- Bootstrap Maña Katha on a fresh Supabase project (safe to re-run)
-- Project: hsvwjjutoxjvirehqktv (mana-katha)

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'received', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES menu_categories(id),
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

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  cost_per_unit_cents INT NOT NULL CHECK (cost_per_unit_cents >= 0),
  current_stock DECIMAL(10,3) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (menu_item_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  customer_phone TEXT,
  status order_status DEFAULT 'received',
  total_cents INT NOT NULL,
  tracking_token TEXT NOT NULL UNIQUE,
  token_number INT,
  idempotency_key TEXT UNIQUE,
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

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number INT;

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  item_price_cents INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  customizations JSONB DEFAULT '{}',
  prep_time_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_available ON menu_items(category_id, is_available);

CREATE TABLE IF NOT EXISTS public.event_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  event_date DATE,
  guest_count INT,
  occasion TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_bookings_created ON public.event_bookings(created_at DESC);

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON public.feedbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  order_count INT NOT NULL DEFAULT 0,
  completed_count INT NOT NULL DEFAULT 0,
  cancelled_count INT NOT NULL DEFAULT 0,
  total_spent_cents INT NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_last_order ON public.customers(last_order_at DESC);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'menu_categories','menu_items','ingredients','recipe_ingredients',
        'orders','order_items','order_status_events','customers','event_bookings','feedbacks'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY cafe_menu_categories_select ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_menu_categories_write ON public.menu_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY cafe_menu_items_select ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_menu_items_write ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY cafe_ingredients_select ON public.ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_ingredients_write ON public.ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY cafe_recipes_select ON public.recipe_ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_recipes_write ON public.recipe_ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY cafe_orders_all ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_order_items_all ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_order_events_all ON public.order_status_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_customers_all ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_event_bookings_all ON public.event_bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_feedbacks_all ON public.feedbacks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_ingredients TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_status_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_bookings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedbacks TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
