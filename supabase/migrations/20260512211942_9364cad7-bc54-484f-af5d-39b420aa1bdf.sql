
-- =========== ROLES ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Roles: own select" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Roles: admin select all" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to the fixed admin email on signup
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'sevencasado454545@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_signup();

-- Also make sure the standard profile trigger exists (it already does)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- If admin user already exists, grant role retroactively
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'sevencasado454545@gmail.com'
ON CONFLICT DO NOTHING;

-- =========== PROFILES: banned flag + email cache ===========
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill emails
UPDATE public.profiles p SET email = u.email
FROM auth.users u WHERE p.id = u.id AND p.email IS NULL;

-- Update handle_new_user to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, dm_balance, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    0,
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Admin policies for full access
CREATE POLICY "Profiles: admin select all" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: admin update all" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Campaigns: admin select all" ON public.campaigns
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Purchases: admin select all" ON public.dm_purchases
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Intents: admin select all" ON public.payment_intents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =========== CAMPAIGN SEGMENTATION ===========
-- Expand niche enum
ALTER TYPE public.campaign_niche ADD VALUE IF NOT EXISTS 'apostas';
ALTER TYPE public.campaign_niche ADD VALUE IF NOT EXISTS 'hot';
ALTER TYPE public.campaign_niche ADD VALUE IF NOT EXISTS 'fitness';
ALTER TYPE public.campaign_niche ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.campaign_niche ADD VALUE IF NOT EXISTS 'ecommerce';

CREATE TYPE public.campaign_gender AS ENUM ('all', 'male', 'female');

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS age_min int NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS age_max int NOT NULL DEFAULT 65,
  ADD COLUMN IF NOT EXISTS gender campaign_gender NOT NULL DEFAULT 'all';

-- =========== ADMIN RPCS ===========
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(_user_id uuid, _delta int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.profiles
    SET dm_balance = GREATEST(0, dm_balance + _delta), updated_at = now()
    WHERE id = _user_id
    RETURNING dm_balance INTO _new;
  RETURN jsonb_build_object('balance', _new);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_banned(_user_id uuid, _banned boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.profiles SET banned = _banned, updated_at = now() WHERE id = _user_id;
  RETURN jsonb_build_object('banned', _banned);
END;
$$;

-- =========== PACKAGE PRICE CAP (≤ R$400) ===========
UPDATE public.dm_packages SET price_brl = 399.00, quantity = 7000, name = 'Master'
  WHERE name = 'Scale';
UPDATE public.dm_packages SET price_brl = 379.00 WHERE name = 'Pro';
