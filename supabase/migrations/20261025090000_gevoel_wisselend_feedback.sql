-- Wisselende missie: per ochtend één missie uit de gekozen lijst
alter table public.alarms add column wisselend boolean not null default false;
-- Op officiële feestdagen (land van het toestel) niet afgaan
alter table public.alarms add column feestdagen_overslaan boolean not null default false;

-- Hoe je je voelt na de missie (1 = moe, 2 = oké, 3 = sterk); optioneel
alter table public.missie_sessies add column gevoel smallint check (gevoel between 1 and 3);

-- Alleen het gevoel van je eigen missies mag achteraf nog veranderen
revoke update on public.missie_sessies from authenticated;
grant update (gevoel) on public.missie_sessies to authenticated;
create policy "Eigen gevoel bijwerken" on public.missie_sessies
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Feedback uit de app; alleen zelf aanmaken en je eigen berichten lezen
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  soort text not null check (soort in ('probleem', 'idee', 'anders')),
  tekst text not null check (char_length(tekst) between 1 and 2000),
  appversie text check (char_length(appversie) <= 100),
  toestel text check (char_length(toestel) <= 200),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Eigen feedback aanmaken" on public.feedback
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Eigen feedback lezen" on public.feedback
  for select to authenticated
  using ((select auth.uid()) = user_id);

create index feedback_user_id_idx on public.feedback (user_id);
