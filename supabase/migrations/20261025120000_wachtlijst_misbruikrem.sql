-- Wachtlijst van de website: één e-mail zodra de app in de stores staat.
-- Alleen bereikbaar via de Edge Function `wachtlijst` (service role); geen policies.
create table public.wachtlijst (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254 and email like '%@%'),
  taal text not null default 'nl' check (taal in ('nl', 'en', 'es', 'de', 'fr')),
  created_at timestamptz not null default now()
);

alter table public.wachtlijst enable row level security;

-- Misbruikrem voor Edge Functions: één rij per verzoek, sleutel is een hash (nooit een IP-adres)
create table public.misbruikrem (
  id bigint generated always as identity primary key,
  sleutel text not null,
  created_at timestamptz not null default now()
);

alter table public.misbruikrem enable row level security;

create index misbruikrem_sleutel_tijd_idx on public.misbruikrem (sleutel, created_at);
