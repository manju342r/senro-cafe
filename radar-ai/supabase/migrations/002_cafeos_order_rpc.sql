-- CaféOS 002: atomic order-creation RPC (called by api/orders-create.js with anon key).
-- SECURITY DEFINER runs the multi-row insert as one transaction; prices and
-- availability are always read from the DB, never trusted from the client.

CREATE OR REPLACE FUNCTION public.create_order(
  p_items JSONB,              -- [{menu_item_id: uuid, quantity: int, customizations: object}]
  p_customer_name TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order orders;
  v_item JSONB;
  v_menu menu_items;
  v_qty INT;
  v_total INT := 0;
  v_prep_total INT := 0;
  v_ahead INT;
  v_line_total INT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_order' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'too_many_lines' USING ERRCODE = 'P0001';
  END IF;

  -- Idempotent replay: same key returns the original order, no duplicate.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_order; END IF;
  END IF;

  -- Validate + snapshot each line from live DB rows (locks rows against edits).
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := COALESCE((v_item->>'quantity')::INT, 0);
    IF v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'invalid_quantity: %', v_item->>'menu_item_id' USING ERRCODE = 'P0001';
    END IF;
    SELECT * INTO v_menu FROM public.menu_items
      WHERE id = (v_item->>'menu_item_id')::UUID FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'item_not_found: %', v_item->>'menu_item_id' USING ERRCODE = 'P0002';
    END IF;
    IF NOT v_menu.is_available THEN
      RAISE EXCEPTION 'item_unavailable: %', v_menu.name USING ERRCODE = 'P0001';
    END IF;
    v_line_total := v_menu.price_cents * v_qty;
    v_total := v_total + v_line_total;
    v_prep_total := v_prep_total + (v_menu.prep_time_seconds * v_qty);
  END LOOP;

  -- Queue-aware estimate: orders ahead × 3 min + this order's prep seconds.
  SELECT COUNT(*) INTO v_ahead FROM public.orders
    WHERE status IN ('received', 'accepted', 'preparing');

  INSERT INTO public.orders (customer_name, total_cents, idempotency_key, estimated_ready_at)
  VALUES (
    NULLIF(TRIM(COALESCE(p_customer_name, '')), ''),
    v_total,
    p_idempotency_key,
    NOW() + ((v_ahead * 180 + v_prep_total) || ' seconds')::INTERVAL
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_menu FROM public.menu_items
      WHERE id = (v_item->>'menu_item_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;
    INSERT INTO public.order_items
      (order_id, menu_item_id, item_name, item_price_cents, quantity, customizations, prep_time_seconds)
    VALUES (
      v_order.id, v_menu.id, v_menu.name, v_menu.price_cents, v_qty,
      COALESCE(v_item->'customizations', '{}'::JSONB), v_menu.prep_time_seconds
    );
  END LOOP;

  INSERT INTO public.order_status_events (order_id, from_status, to_status)
  VALUES (v_order.id, NULL, 'received');

  RETURN v_order;
END $$;
