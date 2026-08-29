-- Virtual Plant schema — Supabase PostgreSQL
-- Project ref: ytxxcnlajceojbdxreku
-- Apply with: supabase db push   OR paste into the SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plant_name text not null default 'Sprout',
  anchors text[] not null default '{}',
  location jsonb,
  behavior jsonb not null default '{"bedtimeScreenMins":20,"sleepHours":7.5}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  season_start timestamptz not null,
  water numeric(6,2) not null check (water between 0 and 100),
  sun numeric(6,2) not null check (sun between 0 and 100),
  fertilizer numeric(6,2) not null check (fertilizer between 0 and 100),
  hp numeric(6,2) not null default 100 check (hp between 0 and 100),
  growth_accumulated numeric(6,2) not null default 8,
  habits_completed integer not null default 0,
  last_tick timestamptz not null default now(),
  deck jsonb not null default '[]'::jsonb,
  deck_date text,
  weather jsonb,
  status text not null default 'active' check (status in ('active', 'complete', 'dead')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seasons_one_active_per_user
  on public.seasons (user_id)
  where status = 'active';

create index if not exists seasons_user_id_idx on public.seasons (user_id);

create table if not exists public.daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day integer not null check (day between 1 and 90),
  snapshot_date date not null,
  health numeric(6,2) not null,
  hp numeric(6,2) not null,
  resources jsonb not null,
  plant_status text not null,
  stage integer not null,
  growth_accumulated numeric(6,2) not null,
  weather jsonb,
  time_of_day text,
  unique (season_id, snapshot_date)
);

create index if not exists daily_snapshots_user_idx on public.daily_snapshots (user_id, snapshot_date);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  season_id uuid references public.seasons (id) on delete set null,
  logged_on date not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.archived_trees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('yard', 'graveyard')),
  reason text not null check (reason in ('complete', 'dead')),
  plant_name text not null,
  quarter_id text not null,
  quarter_name text not null,
  year integer not null,
  classification text not null check (classification in ('grand', 'standard', 'stunted')),
  c_season numeric(6,2) not null,
  habits_completed integer not null default 0,
  snapshots jsonb not null default '[]'::jsonb,
  season_start timestamptz not null,
  ended_at timestamptz not null default now()
);

create index if not exists archived_trees_user_year_idx on public.archived_trees (user_id, year, kind);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  season_id uuid references public.seasons (id) on delete set null,
  habit_id text not null,
  slot text,
  resource text not null,
  gain numeric(6,2) not null,
  completed_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.daily_snapshots enable row level security;
alter table public.milestones enable row level security;
alter table public.archived_trees enable row level security;
alter table public.habit_logs enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "seasons_own" on public.seasons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "snapshots_own" on public.daily_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "milestones_own" on public.milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "archives_own" on public.archived_trees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habit_logs_own" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Service role (n8n / FastAPI) bypasses RLS by default.
