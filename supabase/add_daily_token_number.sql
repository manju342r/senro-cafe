-- Daily pickup tokens: 1, 2, 3… reset each day (Asia/Kolkata).
-- Run once in SQL Editor for mana-katha.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number INT;

CREATE TABLE IF NOT EXISTS public.order_daily_counters (
  day DATE PRIMARY KEY,
  last_token INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_order_token()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d DATE := (timezone('Asia/Kolkata', now()))::date;
  n INT;
BEGIN
  INSERT INTO public.order_daily_counters AS c (day, last_token)
  VALUES (d, 1)
  ON CONFLICT (day) DO UPDATE
    SET last_token = c.last_token + 1
  RETURNING last_token INTO n;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_order_token() TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.order_daily_counters TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_orders_token_day
  ON public.orders ((timezone('Asia/Kolkata', created_at)::date), token_number);
