-- Enums
create type public.campaign_objective as enum ('traffic', 'conversion', 'engagement');
create type public.campaign_status as enum ('draft', 'active', 'paused', 'completed');
create type public.campaign_niche as enum ('gaming', 'income', 'crypto', 'adult', 'news', 'tech', 'lifestyle');
create type public.transaction_type as enum ('deposit', 'spend', 'refund');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles: owner select" on public.profiles for select using (auth.uid() = id);
create policy "Profiles: owner update" on public.profiles for update using (auth.uid() = id);
create policy "Profiles: owner insert" on public.profiles for insert with check (auth.uid() = id);

-- Campaigns
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  objective public.campaign_objective not null default 'traffic',
  status public.campaign_status not null default 'draft',
  niche public.campaign_niche not null default 'tech',
  text text not null default '',
  description text not null default '',
  video_url text,
  button_label text not null default '',
  button_url text not null default '',
  budget numeric(12,2) not null default 0,
  spent numeric(12,2) not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.campaigns enable row level security;
create index campaigns_user_idx on public.campaigns(user_id);

create policy "Campaigns: owner select" on public.campaigns for select using (auth.uid() = user_id);
create policy "Campaigns: owner insert" on public.campaigns for insert with check (auth.uid() = user_id);
create policy "Campaigns: owner update" on public.campaigns for update using (auth.uid() = user_id);
create policy "Campaigns: owner delete" on public.campaigns for delete using (auth.uid() = user_id);

-- Daily metrics
create table public.campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (campaign_id, day)
);
alter table public.campaign_metrics enable row level security;
create index campaign_metrics_user_idx on public.campaign_metrics(user_id);

create policy "Metrics: owner select" on public.campaign_metrics for select using (auth.uid() = user_id);
create policy "Metrics: owner insert" on public.campaign_metrics for insert with check (auth.uid() = user_id);

-- Wallet transactions
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.transaction_type not null,
  amount numeric(12,2) not null,
  description text not null default '',
  created_at timestamptz not null default now()
);
alter table public.wallet_transactions enable row level security;
create index wallet_transactions_user_idx on public.wallet_transactions(user_id);

create policy "Wallet: owner select" on public.wallet_transactions for select using (auth.uid() = user_id);
create policy "Wallet: owner insert" on public.wallet_transactions for insert with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger campaigns_set_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

-- Auto profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    100.00
  );
  insert into public.wallet_transactions (user_id, type, amount, description)
  values (new.id, 'deposit', 100.00, 'Crédito de boas-vindas');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();