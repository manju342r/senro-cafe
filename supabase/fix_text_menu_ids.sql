-- Fix: seed menu uses text IDs (item-alfredo-veg-penne), not UUIDs.
-- Safe on a fresh/empty mana-katha project. Re-run bootstrap policies after if needed.

DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;

CREATE TABLE public.menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.menu_categories(id),
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

CREATE TABLE public.ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  cost_per_unit_cents INT NOT NULL CHECK (cost_per_unit_cents >= 0),
  current_stock DECIMAL(10,3) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.recipe_ingredients (
  id TEXT PRIMARY KEY,
  menu_item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (menu_item_id, ingredient_id)
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES public.menu_items(id),
  item_name TEXT NOT NULL,
  item_price_cents INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  customizations JSONB DEFAULT '{}',
  prep_time_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_available ON public.menu_items(category_id, is_available);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cafe_menu_categories_select ON public.menu_categories;
DROP POLICY IF EXISTS cafe_menu_categories_write ON public.menu_categories;
DROP POLICY IF EXISTS cafe_menu_items_select ON public.menu_items;
DROP POLICY IF EXISTS cafe_menu_items_write ON public.menu_items;
DROP POLICY IF EXISTS cafe_ingredients_select ON public.ingredients;
DROP POLICY IF EXISTS cafe_ingredients_write ON public.ingredients;
DROP POLICY IF EXISTS cafe_recipes_select ON public.recipe_ingredients;
DROP POLICY IF EXISTS cafe_recipes_write ON public.recipe_ingredients;
DROP POLICY IF EXISTS cafe_order_items_all ON public.order_items;

CREATE POLICY cafe_menu_categories_select ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_menu_categories_write ON public.menu_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_menu_items_select ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_menu_items_write ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_ingredients_select ON public.ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_ingredients_write ON public.ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_recipes_select ON public.recipe_ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cafe_recipes_write ON public.recipe_ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY cafe_order_items_all ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_ingredients TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;
