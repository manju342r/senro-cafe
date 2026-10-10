-- Run once in Supabase Dashboard → SQL Editor (project deqksgtrsloiqspsfxdb)
-- Enables public café ordering + staff tools with the anon key.

-- Event booking inquiries from the website
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

-- Customers (upserted on each order)
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

-- Drop old policies if re-run
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'menu_categories','menu_items','ingredients','recipe_ingredients',
        'orders','order_items','order_status_events','customers','event_bookings'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Menu: public read; staff app writes via anon (password gate is in the app)
CREATE POLICY cafe_menu_categories_select ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_menu_categories_write ON public.menu_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY cafe_menu_items_select ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_menu_items_write ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY cafe_ingredients_select ON public.ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_ingredients_write ON public.ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY cafe_recipes_select ON public.recipe_ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_recipes_write ON public.recipe_ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Orders + customers: full live café access for anon key
CREATE POLICY cafe_orders_all ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_order_items_all ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_order_events_all ON public.order_status_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_customers_all ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_event_bookings_all ON public.event_bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_bookings TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Live status updates for customer tracking (Realtime)
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
