-- CaféOS demo seed: 3 categories, 10 items, 5 ingredients, recipes.
-- Run AFTER 001_cafeos.sql in Supabase Dashboard → SQL Editor.
-- Prices in paise/cents; adjust currency display in app (formatCents).

INSERT INTO menu_categories (name, display_order) VALUES
  ('Espresso & Coffee', 1),
  ('Bakery', 2),
  ('Lunch', 3)
ON CONFLICT DO NOTHING;

-- Ingredients (costs are demo values — replace with actual supplier costs)
INSERT INTO ingredients (name, unit, cost_per_unit_cents) VALUES
  ('Espresso beans', 'g', 8),
  ('Milk', 'ml', 1),
  ('Croissant dough', 'pcs', 900),
  ('Sourdough loaf', 'pcs', 2500),
  ('Sandwich filling', 'g', 4)
ON CONFLICT (name) DO NOTHING;

-- Menu items (lookup category ids by name)
WITH cats AS (SELECT id, name FROM menu_categories)
INSERT INTO menu_items (category_id, name, description, price_cents, prep_time_seconds, display_order)
SELECT cats.id, v.name, v.description, v.price_cents, v.prep, v.ord
FROM cats JOIN (VALUES
  ('Espresso & Coffee', 'Espresso', 'Double shot, single origin', 18000, 90, 1),
  ('Espresso & Coffee', 'Cappuccino', 'Espresso, steamed milk, foam', 24000, 150, 2),
  ('Espresso & Coffee', 'Cold Brew', '18-hour slow steep, served over ice', 26000, 60, 3),
  ('Bakery', 'Butter Croissant', 'Laminated, baked fresh morning', 22000, 60, 1),
  ('Bakery', 'Banana Bread Slice', 'Toasted, served with butter', 18000, 120, 2),
  ('Lunch', 'Club Sandwich', 'Triple layer, fries on side', 32000, 480, 1),
  ('Lunch', 'Pesto Pasta', 'Basil pesto, parmesan, pine nuts', 34000, 540, 2),
  ('Lunch', 'Soup of the Day', 'Ask staff for today''s soup', 24000, 240, 3),
  ('Espresso & Coffee', 'Masala Chai', 'Assam tea, ginger, spices, milk', 16000, 180, 4),
  ('Bakery', 'Choc Chip Cookie', 'Sea salt, dark chocolate', 14000, 60, 3)
) AS v(cat, name, description, price_cents, prep, ord) ON v.cat = cats.name
ON CONFLICT DO NOTHING;

-- Recipes (demo quantities — measure actuals before trusting margins)
WITH ids AS (
  SELECT mi.name AS item, mi.id AS item_id, ing.name AS ing, ing.id AS ing_id
  FROM menu_items mi CROSS JOIN ingredients ing
)
INSERT INTO recipe_ingredients (menu_item_id, ingredient_id, quantity)
SELECT item_id, ing_id, q FROM ids JOIN (VALUES
  ('Espresso', 'Espresso beans', 18),
  ('Cappuccino', 'Espresso beans', 18),
  ('Cappuccino', 'Milk', 150),
  ('Cold Brew', 'Espresso beans', 30),
  ('Masala Chai', 'Milk', 120),
  ('Butter Croissant', 'Croissant dough', 1),
  ('Club Sandwich', 'Sourdough loaf', 0.5),
  ('Club Sandwich', 'Sandwich filling', 80),
  ('Pesto Pasta', 'Sandwich filling', 60)
) AS r(item, ing, q) ON r.item = ids.item AND r.ing = ids.ing
ON CONFLICT DO NOTHING;
