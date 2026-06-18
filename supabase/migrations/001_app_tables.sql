-- Run via: npx supabase db push
-- Or paste into Supabase Dashboard → SQL Editor

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_complete boolean not null default false,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  meal text,
  food_id text,
  name text not null,
  servings numeric default 1,
  serving text,
  calories numeric default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  image_uri text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_logs_user_date_idx on public.food_logs (user_id, logged_date);

create table if not exists public.saved_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null,
  food jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, food_id)
);

alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;
alter table public.saved_foods enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "food_logs_select_own" on public.food_logs;
drop policy if exists "food_logs_insert_own" on public.food_logs;
drop policy if exists "food_logs_update_own" on public.food_logs;
drop policy if exists "food_logs_delete_own" on public.food_logs;
drop policy if exists "saved_foods_select_own" on public.saved_foods;
drop policy if exists "saved_foods_insert_own" on public.saved_foods;
drop policy if exists "saved_foods_update_own" on public.saved_foods;
drop policy if exists "saved_foods_delete_own" on public.saved_foods;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

create policy "food_logs_select_own" on public.food_logs for select using (auth.uid() = user_id);
create policy "food_logs_insert_own" on public.food_logs for insert with check (auth.uid() = user_id);
create policy "food_logs_update_own" on public.food_logs for update using (auth.uid() = user_id);
create policy "food_logs_delete_own" on public.food_logs for delete using (auth.uid() = user_id);

create policy "saved_foods_select_own" on public.saved_foods for select using (auth.uid() = user_id);
create policy "saved_foods_insert_own" on public.saved_foods for insert with check (auth.uid() = user_id);
create policy "saved_foods_update_own" on public.saved_foods for update using (auth.uid() = user_id);
create policy "saved_foods_delete_own" on public.saved_foods for delete using (auth.uid() = user_id);
