-- Logboek van beheeracties (account verwijderen, inlogcode sturen, wachtlijst opschonen).
-- Alleen de Edge Function admin-actie schrijft hierin (service role); geen policies.
create table public.beheer_log (
  id bigint generated always as identity primary key,
  beheerder_id uuid references auth.users (id) on delete set null,
  actie text not null,
  doel text,
  created_at timestamptz not null default now()
);

alter table public.beheer_log enable row level security;
