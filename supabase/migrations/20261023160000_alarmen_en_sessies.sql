create table public.alarms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  naam text not null default 'Mijn Mooove-missie' check (char_length(naam) between 1 and 40),
  tijd text not null check (tijd ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  dagen smallint[] not null check (cardinality(dagen) between 1 and 7 and dagen <@ array[0,1,2,3,4,5,6]::smallint[]),
  niveau text not null check (niveau in ('Vrij', 'Flexibel', 'Uitstelbaar', 'Verplicht', 'Hardcore')),
  oefeningen text[] not null check (cardinality(oefeningen) between 1 and 6 and oefeningen <@ array['Squats', 'Push-ups', 'Jumping jacks', 'Plank', 'Bed opmaken', 'Gordijnen open']),
  aan boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index alarms_user_id_idx on public.alarms (user_id);

alter table public.alarms enable row level security;

create policy "Eigen alarmen lezen" on public.alarms
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Eigen alarmen aanmaken" on public.alarms
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Eigen alarmen bijwerken" on public.alarms
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Eigen alarmen verwijderen" on public.alarms
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger alarms_updated_at
  before update on public.alarms
  for each row execute function public.set_updated_at();

create table public.missie_sessies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alarm_id uuid references public.alarms (id) on delete set null,
  gestart_op timestamptz not null,
  afgerond_op timestamptz not null default now(),
  status text not null check (status in ('voltooid', 'afgebroken')),
  stappen jsonb not null default '[]'::jsonb,
  totaal_herhalingen integer not null default 0 check (totaal_herhalingen >= 0),
  created_at timestamptz not null default now()
);

create index missie_sessies_user_id_idx on public.missie_sessies (user_id, afgerond_op desc);
create index missie_sessies_alarm_id_idx on public.missie_sessies (alarm_id);

alter table public.missie_sessies enable row level security;

create policy "Eigen sessies lezen" on public.missie_sessies
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Eigen sessies aanmaken" on public.missie_sessies
  for insert to authenticated with check ((select auth.uid()) = user_id);

alter table public.profiles
  add column weekdoel smallint not null default 7 check (weekdoel between 1 and 7),
  add column alarmtest_geslaagd_op timestamptz;
