-- Mana Katha Cafe menu seed: 18 categories, 132 items.
-- Replaces the demo seed. Run AFTER 001/002/003 on a database with NO orders
-- (it clears menu_categories/menu_items/ingredients/recipe_ingredients).
-- Prices in paise. No recipes: costs report as unknown until entered.

DELETE FROM recipe_ingredients WHERE id <> '00000000-0000-0000-0000-000000000000';
DELETE FROM menu_items WHERE id <> '00000000-0000-0000-0000-000000000000';
DELETE FROM ingredients WHERE id <> '00000000-0000-0000-0000-000000000000';
DELETE FROM menu_categories WHERE id <> '00000000-0000-0000-0000-000000000000';

-- Veg Starters (14)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Veg Starters', 1) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 300, v.ord FROM c JOIN (VALUES
  ('Cheese Garlic Bread', 25000, 1),
  ('Potato Wedges', 25000, 2),
  ('Peri Peri French Fries', 24000, 3),
  ('Chilli Mint Paneer', 29000, 4),
  ('Salted Fries', 22000, 5),
  ('Veg Cigar Rolls', 30000, 6),
  ('Nachos', 30000, 7),
  ('Cheese Balls', 29000, 8),
  ('Onion Rings', 28000, 9),
  ('Paneer Bruschetta', 29000, 10),
  ('Chilli Paneer', 29900, 11),
  ('Paneer Popcorn', 29000, 12),
  ('Peri Peri Corn Kernels', 29900, 13),
  ('Crispy Corn Kernels', 23300, 14)
) AS v(name, price, ord) ON true;

-- Veg Pasta (10)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Veg Pasta', 2) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 600, v.ord FROM c JOIN (VALUES
  ('Alfredo Veg Penne Pasta', 35000, 1),
  ('Basil Pesto Veg Penne Pasta', 36000, 2),
  ('Alfredo Veg Spaghetti Pasta', 36000, 3),
  ('Mac and Cheese Pasta', 38000, 4),
  ('Arrabbiata Veg Penne Pasta', 36000, 5),
  ('Pink Sauce Veg Penne Pasta', 37000, 6),
  ('Arrabbiata Veg Spaghetti Pasta', 31100, 7),
  ('Pink Sauce Veg Spaghetti Pasta', 31100, 8),
  ('Basil Pesto Veg Spaghetti Pasta', 31900, 9),
  ('Spaghetti Aglio Olio Veg', 35000, 10)
) AS v(name, price, ord) ON true;

-- Veg Pizzas (6)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Veg Pizzas', 3) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 720, v.ord FROM c JOIN (VALUES
  ('Margherita Pizza', 41500, 1),
  ('Paneer Tikka Pizza', 46800, 2),
  ('Farm Fresh Pizza', 46000, 3),
  ('Peri Peri Paneer Pizza', 46700, 4),
  ('Mushroom Pizza', 48000, 5),
  ('Polo Pesto Pizza', 41500, 6)
) AS v(name, price, ord) ON true;

-- Veg Rice and Biryani (4)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Veg Rice and Biryani', 4) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 600, v.ord FROM c JOIN (VALUES
  ('Paneer Kaju Biryani Bowl', 45000, 1),
  ('Mushroom Biryani Bowl', 42000, 2),
  ('Gongura Paneer Biryani Bowl', 44000, 3),
  ('Gutti Vankaya Biryani', 42000, 4)
) AS v(name, price, ord) ON true;

-- Veg Rice Bowls (3)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Veg Rice Bowls', 5) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 480, v.ord FROM c JOIN (VALUES
  ('Mexican Bowl Veg', 41500, 1),
  ('Butter Paneer Bowl', 41500, 2),
  ('Veg Stroganoff', 41500, 3)
) AS v(name, price, ord) ON true;

-- Veg Burgers (3)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Veg Burgers', 6) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 420, v.ord FROM c JOIN (VALUES
  ('Paneer Keema Burger', 33700, 1),
  ('Veg Pattie Burger', 32400, 2),
  ('Crumb Fried Paneer Burger', 34900, 3)
) AS v(name, price, ord) ON true;

-- Veg Sandwiches (4)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Veg Sandwiches', 7) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 360, v.ord FROM c JOIN (VALUES
  ('Corn and Spinach Sandwich', 29800, 1),
  ('Potato Cutlet Sandwich', 29800, 2),
  ('Veg Grilled Sandwich', 25000, 3),
  ('Veg Club Sandwich', 28500, 4)
) AS v(name, price, ord) ON true;

-- Non-Veg Starters (11)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Non-Veg Starters', 8) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 300, v.ord FROM c JOIN (VALUES
  ('Coriander Chicken', 35000, 1),
  ('Ghee Roast Chicken', 37000, 2),
  ('Chicken Popcorn', 32000, 3),
  ('Tandoori Prawns', 39000, 4),
  ('Asian Style Butter Garlic Fish', 39000, 5),
  ('Chicken Peri Peri Chips', 38000, 6),
  ('Chilli Chicken', 38000, 7),
  ('Barbeque Chicken Wings', 35000, 8),
  ('Chicken Nachos', 36000, 9),
  ('Chilli Lime Basil Chicken', 38000, 10),
  ('Fish Fingers', 29800, 11)
) AS v(name, price, ord) ON true;

-- Non-Veg Pasta (9)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Non-Veg Pasta', 9) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 600, v.ord FROM c JOIN (VALUES
  ('Alfredo Chicken Penne Pasta', 38000, 1),
  ('Alfredo Non-Veg Spaghetti Pasta', 38000, 2),
  ('Arrabbiata Chicken Penne Pasta', 33700, 3),
  ('Arrabbiata Chicken Spaghetti', 33700, 4),
  ('Pink Sauce Chicken Penne Pasta', 33700, 5),
  ('Pink Sauce Chicken Spaghetti', 33700, 6),
  ('Basil Pesto Chicken Pasta', 34500, 7),
  ('Basil Pesto Non-Veg Spaghetti', 34500, 8),
  ('Spaghetti Aglio Olio Non-Veg', 36300, 9)
) AS v(name, price, ord) ON true;

-- Non-Veg Pizzas (3)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Non-Veg Pizzas', 10) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 720, v.ord FROM c JOIN (VALUES
  ('Peri Peri Chicken Pizza', 49800, 1),
  ('Barbeque Chicken Pizza', 49800, 2),
  ('In-House Sausage Chicken Pizza', 49000, 3)
) AS v(name, price, ord) ON true;

-- Non-Veg Rice and Biryani (4)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Non-Veg Rice and Biryani', 11) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 600, v.ord FROM c JOIN (VALUES
  ('Coconut Biryani with Indrani Chicken', 48000, 1),
  ('Chicken Mogali Biryani', 42000, 2),
  ('Mutton Biryani Bowl', 54000, 3),
  ('Ulavacharu Chicken Biryani', 44000, 4)
) AS v(name, price, ord) ON true;

-- Non-Veg Rice Bowls and Chicken Dishes (6)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Non-Veg Rice Bowls and Chicken Dishes', 12) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 480, v.ord FROM c JOIN (VALUES
  ('Butter Chicken Bowl', 45400, 1),
  ('Mexican Non-Veg Bowl', 45400, 2),
  ('Chicken Stroganoff', 45400, 3),
  ('Adraki Chicken', 35000, 4),
  ('Chicken Roast', 35000, 5),
  ('Karivepaku Kodi Vepudu', 32000, 6)
) AS v(name, price, ord) ON true;

-- Non-Veg Burgers (4)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Non-Veg Burgers', 13) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 420, v.ord FROM c JOIN (VALUES
  ('Crunchy Chicken Burger', 37100, 1),
  ('Grilled Chicken Burger', 37100, 2),
  ('Fish Fillet Burger', 38400, 3),
  ('Chicken Mince Burger', 35800, 4)
) AS v(name, price, ord) ON true;

-- Non-Veg Sandwiches (5)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Non-Veg Sandwiches', 14) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 360, v.ord FROM c JOIN (VALUES
  ('Non-Veg Club Sandwich', 32400, 1),
  ('Egg and Cheese Sandwich', 32400, 2),
  ('Grilled Chicken Sandwich', 32400, 3),
  ('Lamb and Onion Barbeque Sandwich', 35000, 4),
  ('Peri Peri Chicken Sandwich', 32400, 5)
) AS v(name, price, ord) ON true;

-- Hot Coffee (12)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Hot Coffee', 15) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 150, v.ord FROM c JOIN (VALUES
  ('Espresso', 18900, 1),
  ('Americano', 19900, 2),
  ('Affogato', 20700, 3),
  ('Caramel Macchiato', 20700, 4),
  ('Flat White', 22000, 5),
  ('Cappuccino', 23300, 6),
  ('Cafe Latte', 23300, 7),
  ('Mocha', 24600, 8),
  ('Flavoured Cappuccino', 24600, 9),
  ('Flavoured Cafe Latte', 24600, 10),
  ('Vegan Latte', 25900, 11),
  ('Vietnam Hot Coffee', 25900, 12)
) AS v(name, price, ord) ON true;

-- Iced Coffee (12)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Iced Coffee', 16) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 180, v.ord FROM c JOIN (VALUES
  ('Cranberry Coffee', 24600, 1),
  ('Orange Coffee', 24600, 2),
  ('Vietnam Cold Coffee', 24600, 3),
  ('Litchi Coffee', 24600, 4),
  ('Iced Mocha', 24600, 5),
  ('Iced Latte', 24600, 6),
  ('Iced Cappuccino', 24600, 7),
  ('Classic Cold Coffee', 28500, 8),
  ('Brownie Blend', 28500, 9),
  ('Chocolate Blend', 28500, 10),
  ('Oreo Blend', 28500, 11),
  ('Choco Chip Blend', 28500, 12)
) AS v(name, price, ord) ON true;

-- Thickshakes (11)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Thickshakes', 17) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 240, v.ord FROM c JOIN (VALUES
  ('Oreo Thickshake', 28500, 1),
  ('Vanilla Thickshake', 28500, 2),
  ('Brownie Thickshake', 28500, 3),
  ('KitKat Thickshake', 28500, 4),
  ('Blueberry Thickshake', 28500, 5),
  ('Blackcurrant Thickshake', 28500, 6),
  ('Pineapple Thickshake', 28500, 7),
  ('Choco Chip Thickshake', 28500, 8),
  ('Peanut Butter Thickshake', 28500, 9),
  ('Nutella Thickshake', 28500, 10),
  ('Banana Caramel Thickshake', 28500, 11)
) AS v(name, price, ord) ON true;

-- Refreshing Drinks and Mojitos (11)
WITH c AS (INSERT INTO menu_categories (name, display_order) VALUES ('Refreshing Drinks and Mojitos', 18) RETURNING id)
INSERT INTO menu_items (category_id, name, price_cents, prep_time_seconds, display_order)
SELECT c.id, v.name, v.price, 180, v.ord FROM c JOIN (VALUES
  ('Fresh Lime', 19400, 1),
  ('Blue Lagoon', 22000, 2),
  ('Long Drive', 22000, 3),
  ('Love Punch', 22000, 4),
  ('Orange Mojito', 22200, 5),
  ('Passion Fruit Mojito', 22200, 6),
  ('Blueberry Mojito', 22200, 7),
  ('Strawberry Mojito', 22200, 8),
  ('Peach Mojito', 22200, 9),
  ('Pineapple Slush', 23300, 10),
  ('Hot Chocolate', 31500, 11)
) AS v(name, price, ord) ON true;
