
-- 1. profiles: balance -> dm_balance
ALTER TABLE public.profiles DROP COLUMN IF EXISTS balance;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dm_balance integer NOT NULL DEFAULT 0;

-- 2. campaigns: drop money cols, add dm cols
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS budget;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS spent;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS dm_total integer NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS dm_sent integer NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS media_url text;

-- 3. dm_packages catalog
CREATE TABLE IF NOT EXISTS public.dm_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity integer NOT NULL,
  price_brl numeric(10,2) NOT NULL,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dm_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Packages: public read" ON public.dm_packages;
CREATE POLICY "Packages: public read" ON public.dm_packages FOR SELECT USING (true);

INSERT INTO public.dm_packages (name, quantity, price_brl, featured, sort_order) VALUES
  ('Starter', 500, 49.90, false, 1),
  ('Growth', 1000, 89.90, true, 2),
  ('Pro', 5000, 379.90, false, 3),
  ('Scale', 20000, 1299.90, false, 4)
ON CONFLICT DO NOTHING;

-- 4. dm_purchases
CREATE TABLE IF NOT EXISTS public.dm_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.dm_packages(id),
  package_name text NOT NULL,
  quantity integer NOT NULL,
  price_brl numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dm_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Purchases: owner select" ON public.dm_purchases;
CREATE POLICY "Purchases: owner select" ON public.dm_purchases FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Purchases: owner insert" ON public.dm_purchases;
CREATE POLICY "Purchases: owner insert" ON public.dm_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. drop legacy wallet_transactions
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;

-- 6. update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, dm_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    100
  );
  RETURN NEW;
END;
$$;

-- 7. purchase_dm_package RPC
CREATE OR REPLACE FUNCTION public.purchase_dm_package(_package_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _pkg public.dm_packages%ROWTYPE;
  _purchase_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT * INTO _pkg FROM public.dm_packages WHERE id = _package_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'package not found'; END IF;

  INSERT INTO public.dm_purchases (user_id, package_id, package_name, quantity, price_brl, status)
  VALUES (_uid, _pkg.id, _pkg.name, _pkg.quantity, _pkg.price_brl, 'paid')
  RETURNING id INTO _purchase_id;

  UPDATE public.profiles SET dm_balance = dm_balance + _pkg.quantity, updated_at = now()
  WHERE id = _uid;

  RETURN jsonb_build_object('purchase_id', _purchase_id, 'quantity', _pkg.quantity);
END;
$$;

-- 8. consume_dms RPC
CREATE OR REPLACE FUNCTION public.consume_dms(_campaign_id uuid, _qty integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _balance integer;
  _camp public.campaigns%ROWTYPE;
  _new_sent integer;
  _new_status public.campaign_status;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _qty <= 0 THEN RAISE EXCEPTION 'qty must be > 0'; END IF;

  SELECT * INTO _camp FROM public.campaigns WHERE id = _campaign_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign not found'; END IF;

  SELECT dm_balance INTO _balance FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _balance < _qty THEN RAISE EXCEPTION 'insufficient dm balance'; END IF;

  _new_sent := LEAST(_camp.dm_sent + _qty, _camp.dm_total);
  _new_status := _camp.status;
  IF _new_sent >= _camp.dm_total THEN _new_status := 'completed'; END IF;

  UPDATE public.profiles SET dm_balance = dm_balance - _qty, updated_at = now() WHERE id = _uid;
  UPDATE public.campaigns SET dm_sent = _new_sent, status = _new_status, updated_at = now() WHERE id = _campaign_id;

  RETURN jsonb_build_object('dm_sent', _new_sent, 'status', _new_status);
END;
$$;
