
-- 1) New users get 0 DMs (no free bonus)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, dm_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    0
  );
  RETURN NEW;
END;
$function$;

ALTER TABLE public.profiles ALTER COLUMN dm_balance SET DEFAULT 0;

-- 2) Zero out all existing balances — paid DMs only from now on
UPDATE public.profiles SET dm_balance = 0;

-- 3) Payment intents table for Paradise PIX checkout
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid NOT NULL,
  package_name text NOT NULL,
  quantity integer NOT NULL,
  amount_cents integer NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_document text NOT NULL,
  customer_phone text NOT NULL,
  reference text NOT NULL UNIQUE,
  gateway_transaction_id text,
  qr_code text,
  qr_code_base64 text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | failed | refunded
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intents: owner select" ON public.payment_intents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Intents: owner insert" ON public.payment_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON public.payment_intents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_reference ON public.payment_intents(reference);

CREATE TRIGGER tg_payment_intents_updated
BEFORE UPDATE ON public.payment_intents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Helper to credit DMs on confirmed payment (called by webhook with service role)
CREATE OR REPLACE FUNCTION public.confirm_payment_intent(_reference text, _gateway_tx text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _intent public.payment_intents%ROWTYPE;
BEGIN
  SELECT * INTO _intent FROM public.payment_intents WHERE reference = _reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'intent not found'; END IF;
  IF _intent.status = 'approved' THEN
    RETURN jsonb_build_object('already_approved', true, 'intent_id', _intent.id);
  END IF;

  UPDATE public.payment_intents
    SET status = 'approved', gateway_transaction_id = COALESCE(_gateway_tx, gateway_transaction_id), updated_at = now()
    WHERE id = _intent.id;

  INSERT INTO public.dm_purchases (user_id, package_id, package_name, quantity, price_brl, status)
  VALUES (_intent.user_id, _intent.package_id, _intent.package_name, _intent.quantity, _intent.amount_cents::numeric / 100, 'paid');

  UPDATE public.profiles SET dm_balance = dm_balance + _intent.quantity, updated_at = now()
  WHERE id = _intent.user_id;

  RETURN jsonb_build_object('approved', true, 'intent_id', _intent.id, 'credited', _intent.quantity);
END;
$function$;
