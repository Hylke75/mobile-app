-- Eigen missies: een zelfgekozen naam en emoji, afgerond met een timer of een foto
create table public.eigen_missies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  naam text not null check (char_length(naam) between 1 and 40),
  emoji text not null default '⭐' check (char_length(emoji) between 1 and 16),
  soort text not null check (soort in ('timer', 'foto')),
  duur_seconden integer not null default 60 check (duur_seconden between 10 and 3600),
  created_at timestamptz not null default now()
);

create index eigen_missies_user_id_idx on public.eigen_missies (user_id);

alter table public.eigen_missies enable row level security;

create policy "Eigen missies lezen" on public.eigen_missies
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Eigen missies aanmaken" on public.eigen_missies
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Eigen missies bijwerken" on public.eigen_missies
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Eigen missies verwijderen" on public.eigen_missies
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Een alarm bevat ingebouwde missies (op naam) en eigen missies ("eigen:<uuid>"), maximaal 12
create function public.geldige_missies(missies text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(missies) between 1 and 12
    and not exists (
      select 1 from unnest(missies) as m
      where m not in (
        'Squats', 'Push-ups', 'Jumping jacks', 'Plank', 'Lunges', 'Kuitheffen', 'Bruggetje',
        'Muurzit', 'Zijplank', 'Boomhouding', 'Bed opmaken', 'Gordijnen open', 'Glas water',
        'Tanden poetsen', 'Ademhaling', 'Stretchen'
      )
      and m !~ '^eigen:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    );
$$;

alter table public.alarms drop constraint alarms_oefeningen_check;
alter table public.alarms add constraint alarms_oefeningen_check check (public.geldige_missies(oefeningen));
