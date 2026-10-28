-- Marketing, fase 1: contacten, aantoonbare toestemming (append-only), suppressies,
-- instellingen, auditlog en events. Alleen bereikbaar via Edge Functions (service role):
-- RLS staat aan zonder policies, dus de app en de browser kunnen hier niets lezen of schrijven.
-- De wachtlijst blijft een aparte lijst (één bericht bij beschikbaarheid) en wordt nooit geïmporteerd.

-- Wachtlijst: Chinees wordt op de site aangeboden, maar stond niet in de check
alter table public.wachtlijst drop constraint if exists wachtlijst_taal_check;
alter table public.wachtlijst
  add constraint wachtlijst_taal_check check (taal in ('nl', 'en', 'es', 'de', 'fr', 'zh'));

-- Rollen in het beheer: owner/admin alles, marketing_editor concepten, analyst alleen lezen
alter table public.admins
  add column rol text not null default 'owner'
    check (rol in ('owner', 'admin', 'marketing_editor', 'analyst'));

create table public.marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email_normalized text not null check (char_length(email_normalized) between 3 and 254),
  locale text not null default 'en' check (locale in ('nl', 'en', 'es', 'de', 'fr', 'zh')),
  country text check (char_length(country) <= 2),
  source text not null default 'website' check (char_length(source) <= 40),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  utm_content text check (char_length(utm_content) <= 100),
  referrer text check (char_length(referrer) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Eén actief contact per e-mailadres
create unique index marketing_contacts_email_actief
  on public.marketing_contacts (email_normalized) where deleted_at is null;
create index marketing_contacts_user on public.marketing_contacts (user_id);

create trigger marketing_contacts_updated_at
  before update on public.marketing_contacts
  for each row execute function public.set_updated_at();

-- Bewijs van toestemming: alleen toevoegen, nooit wijzigen of verwijderen (behalve via cascade
-- bij het verwijderen van een contact op verzoek van de betrokkene).
create table public.marketing_consents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.marketing_contacts (id) on delete cascade,
  purpose text not null check (purpose in ('newsletter', 'product_marketing')),
  status text not null check (status in ('pending', 'granted', 'revoked')),
  method text not null
    check (method in ('form', 'double_opt_in', 'settings', 'admin', 'unsubscribe_link')),
  legal_text_version text,
  legal_text_snapshot text check (char_length(legal_text_snapshot) <= 2000),
  source_url text check (char_length(source_url) <= 300),
  -- Alleen bij 'pending': hash van de bevestigingstoken en hoe lang die geldig is
  proof_token_hash text,
  token_expires_at timestamptz,
  -- Bij 'granted' na dubbele bevestiging: welke aanmelding is bevestigd (eenmalig bruikbaar)
  confirms_consent_id uuid references public.marketing_consents (id) on delete cascade,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index marketing_consents_contact on public.marketing_consents (contact_id, purpose, created_at desc);
create unique index marketing_consents_token on public.marketing_consents (proof_token_hash)
  where proof_token_hash is not null;
create unique index marketing_consents_eenmalig on public.marketing_consents (confirms_consent_id)
  where confirms_consent_id is not null;

create or replace function public.marketing_consents_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'marketing_consents is append-only';
end;
$$;

revoke execute on function public.marketing_consents_append_only() from public, anon, authenticated;

create trigger marketing_consents_geen_wijziging
  before update on public.marketing_consents
  for each row execute function public.marketing_consents_append_only();

-- Nooit meer mailen: afgemeld, hard bounce, klacht, handmatig of verwijderverzoek.
-- Op hash van het genormaliseerde adres, zodat het ook na verwijderen van het contact blijft werken.
create table public.marketing_suppressions (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  contact_id uuid references public.marketing_contacts (id) on delete set null,
  scope text not null default 'marketing' check (scope in ('marketing', 'all')),
  reason text not null
    check (reason in ('unsubscribe', 'hard_bounce', 'spam_complaint', 'manual', 'deletion_request')),
  created_at timestamptz not null default now(),
  unique (email_hash, scope, reason)
);

create index marketing_suppressions_hash on public.marketing_suppressions (email_hash);

-- Instellingen zonder geheimen (sleutels staan in de function-secrets)
create table public.marketing_settings (
  sleutel text primary key check (sleutel ~ '^[a-z_]{2,40}$'),
  waarde jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.marketing_settings (sleutel, waarde) values
  ('send_mode', '"disabled"'),
  ('test_recipients', '[]'),
  ('kill_switch', 'false'),
  ('legal_text_version', '"2026-10-28"');

create table public.marketing_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actie text not null check (char_length(actie) <= 60),
  object_type text check (char_length(object_type) <= 40),
  object_id text check (char_length(object_id) <= 80),
  samenvatting text check (char_length(samenvatting) <= 300),
  created_at timestamptz not null default now()
);

create index marketing_audit_logs_tijd on public.marketing_audit_logs (created_at desc);

create table public.marketing_events (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid references auth.users (id) on delete cascade,
  contact_id uuid references public.marketing_contacts (id) on delete cascade,
  event_name text not null check (event_name ~ '^[a-z_]{2,60}$'),
  event_source text not null check (event_source in ('website', 'app', 'server', 'email_provider', 'store')),
  external_event_id text check (char_length(external_event_id) <= 120),
  occurred_at timestamptz not null default now(),
  properties jsonb not null default '{}' check (pg_column_size(properties) <= 4096),
  created_at timestamptz not null default now(),
  unique (event_source, external_event_id)
);

create index marketing_events_naam_tijd on public.marketing_events (event_name, occurred_at desc);

alter table public.marketing_contacts enable row level security;
alter table public.marketing_consents enable row level security;
alter table public.marketing_suppressions enable row level security;
alter table public.marketing_settings enable row level security;
alter table public.marketing_audit_logs enable row level security;
alter table public.marketing_events enable row level security;

-- Geen policies: alleen de service role (Edge Functions) heeft toegang.
revoke all on public.marketing_contacts, public.marketing_consents, public.marketing_suppressions,
  public.marketing_settings, public.marketing_audit_logs, public.marketing_events
  from anon, authenticated;
