-- ============================================
-- PREDICCIONES SLC - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  logo_url text,
  group_name text,
  created_at timestamptz default now()
);

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_a_id uuid references public.teams(id) not null,
  team_b_id uuid references public.teams(id) not null,
  stage text not null,
  match_date timestamptz not null,
  winner_id uuid references public.teams(id),
  score_a integer,
  score_b integer,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  created_at timestamptz default now()
);

-- Profiles (auto-created from Twitter auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Predictions
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  predicted_team_id uuid references public.teams(id) not null,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Leaderboard view
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  count(pred.id)::int as total_predictions,
  count(case when pred.predicted_team_id = m.winner_id then 1 end)::int as correct_predictions,
  case when count(pred.id) > 0
    then round((count(case when pred.predicted_team_id = m.winner_id then 1 end)::decimal / count(pred.id)) * 100, 1)
    else 0
  end as accuracy
from public.profiles p
left join public.predictions pred on pred.user_id = p.id
left join public.matches m on m.id = pred.match_id
group by p.id, p.username, p.display_name, p.avatar_url
order by correct_predictions desc, accuracy desc;

-- RLS
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.profiles enable row level security;
alter table public.predictions enable row level security;

create policy "Teams are viewable by everyone" on public.teams for select using (true);
create policy "Teams admin insert" on public.teams for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Teams admin update" on public.teams for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create policy "Matches are viewable by everyone" on public.matches for select using (true);
create policy "Matches admin insert" on public.matches for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Matches admin update" on public.matches for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Predictions are viewable by everyone" on public.predictions for select using (true);
create policy "Users can insert own predictions" on public.predictions for insert with check (auth.uid() = user_id);
create policy "Users can update own predictions" on public.predictions for update using (auth.uid() = user_id);
create policy "Users can delete own predictions" on public.predictions for delete using (auth.uid() = user_id);
