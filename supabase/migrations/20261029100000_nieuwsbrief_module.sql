-- Marketing, fase 2: nieuwsbriefmodule. Sjablonen, campagnes met goedkeuring, ontvangers,
-- een verzendwachtrij (outbox) en bezorgmeldingen van de mailprovider. Net als in fase 1 alleen
-- bereikbaar via Edge Functions (service role): RLS aan, geen policies.
-- Er gaat niets de deur uit zolang marketing_settings.send_mode op 'disabled' staat.

create table public.newsletter_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  locale text not null check (locale in ('nl', 'en', 'es', 'de', 'fr', 'zh')),
  category text not null default 'nieuwsbrief' check (char_length(category) <= 40),
  subject_default text not null default '' check (char_length(subject_default) <= 150),
  preheader_default text not null default '' check (char_length(preheader_default) <= 200),
  content_blocks_json jsonb not null default '[]' check (pg_column_size(content_blocks_json) <= 65536),
  version integer not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger newsletter_templates_updated_at
  before update on public.newsletter_templates
  for each row execute function public.set_updated_at();

create table public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null default 'nieuwsbrief' check (slug ~ '^[a-z0-9-]{1,60}$'),
  locale text not null check (locale in ('nl', 'en', 'es', 'de', 'fr', 'zh')),
  subject text not null default '' check (char_length(subject) <= 150),
  preheader text not null default '' check (char_length(preheader) <= 200),
  template_id uuid references public.newsletter_templates (id) on delete set null,
  content_blocks_json jsonb not null default '[]' check (pg_column_size(content_blocks_json) <= 65536),
  -- Doelgroep: altijd alleen contacten met bevestigde nieuwsbrieftoestemming, gefilterd op taal.
  -- De wachtlijst is geen doelgroep.
  segment jsonb not null default '{"talen": []}',
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'scheduled', 'sending', 'paused', 'completed', 'cancelled')),
  scheduled_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  sent_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index newsletter_campaigns_status on public.newsletter_campaigns (status, scheduled_at);

create trigger newsletter_campaigns_updated_at
  before update on public.newsletter_campaigns
  for each row execute function public.set_updated_at();

create table public.newsletter_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns (id) on delete cascade,
  contact_id uuid not null references public.marketing_contacts (id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'skipped', 'failed', 'bounced', 'complained', 'cancelled')),
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  failure_code text check (char_length(failure_code) <= 60),
  unique (campaign_id, contact_id)
);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.marketing_contacts (id) on delete cascade,
  campaign_id uuid references public.newsletter_campaigns (id) on delete cascade,
  automation_enrollment_id uuid,
  email_kind text not null check (email_kind in ('marketing', 'transactional')),
  template_version text,
  render_context_json jsonb not null default '{}' check (pg_column_size(render_context_json) <= 8192),
  scheduled_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'skipped', 'dead', 'cancelled')),
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  locked_at timestamptz,
  provider_message_id text,
  idempotency_key text not null unique check (char_length(idempotency_key) <= 200),
  last_error text check (char_length(last_error) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_outbox_wachtend on public.email_outbox (status, scheduled_at)
  where status in ('pending', 'sending');
create index email_outbox_campagne on public.email_outbox (campaign_id, status);
create index email_outbox_bericht on public.email_outbox (provider_message_id);

create trigger email_outbox_updated_at
  before update on public.email_outbox
  for each row execute function public.set_updated_at();

create table public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid references public.email_outbox (id) on delete set null,
  provider text not null check (char_length(provider) <= 20),
  provider_event_id text unique check (char_length(provider_event_id) <= 120),
  provider_message_id text check (char_length(provider_message_id) <= 120),
  event_type text not null
    check (event_type in ('sent', 'delivered', 'bounced', 'complained', 'unsubscribed', 'delayed', 'other')),
  occurred_at timestamptz not null default now(),
  safe_payload_json jsonb not null default '{}' check (pg_column_size(safe_payload_json) <= 4096),
  created_at timestamptz not null default now()
);

create index email_delivery_events_bericht on public.email_delivery_events (provider_message_id);

-- Werkvoorraad veilig claimen: meerdere workers tegelijk pakken nooit dezelfde mail.
-- Mails van gepauzeerde of geannuleerde campagnes worden niet geclaimd. Een mail die langer
-- dan 10 minuten op 'sending' staat (worker gecrasht), komt opnieuw in aanmerking.
create or replace function public.marketing_claim_outbox(aantal integer)
returns setof public.email_outbox
language sql
security definer
set search_path = ''
as $$
  update public.email_outbox o
  set status = 'sending', locked_at = now(), attempt_count = o.attempt_count + 1
  where o.id in (
    select o2.id
    from public.email_outbox o2
    left join public.newsletter_campaigns c on c.id = o2.campaign_id
    where (o2.status = 'pending' or (o2.status = 'sending' and o2.locked_at < now() - interval '10 minutes'))
      and o2.scheduled_at <= now()
      and (o2.next_retry_at is null or o2.next_retry_at <= now())
      and (o2.campaign_id is null or c.status = 'sending')
    order by o2.scheduled_at
    limit least(greatest(aantal, 1), 200)
    for update of o2 skip locked
  )
  returning o.*;
$$;

revoke execute on function public.marketing_claim_outbox(integer) from public, anon, authenticated;
grant execute on function public.marketing_claim_outbox(integer) to service_role;

alter table public.newsletter_templates enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_campaign_recipients enable row level security;
alter table public.email_outbox enable row level security;
alter table public.email_delivery_events enable row level security;

revoke all on public.newsletter_templates, public.newsletter_campaigns,
  public.newsletter_campaign_recipients, public.email_outbox, public.email_delivery_events
  from anon, authenticated;

insert into public.marketing_settings (sleutel, waarde) values
  ('newsletter_frequency_days', '14'),
  ('timezone', '"Europe/Amsterdam"')
on conflict (sleutel) do nothing;

-- Zes concepten "The Morning MOOOVE" in NL en EN, alleen als concept (niets wordt verstuurd)
insert into public.newsletter_campaigns
  (name, locale, subject, preheader, content_blocks_json, segment, slug)
values
  ('The Morning MOOOVE #1 — stop-snooze (nl)', 'nl', 'Waarom de snoozeknop je ochtend kaapt', 'En wat je morgen anders kunt doen.', '[{"type": "titel", "tekst": "Stop met snoozen"}, {"type": "alinea", "tekst": "Ken je dat? De wekker gaat, je drukt op snooze, en twintig minuten later word je gehaast wakker. Je bent niet de enige: de snoozeknop is voor veel mensen het eerste besluit van de dag, en meteen het makkelijkste."}, {"type": "alinea", "tekst": "Mooove draait dat om. Je wekker stopt pas als je een korte missie hebt gedaan: tien squats, de gordijnen open of je bed opmaken. Je kiest zelf hoe streng: van Vrij (gewoon een stopknop) tot Hardcore (met een wakker-check na vijf minuten)."}, {"type": "alinea", "tekst": "Tip voor morgen: leg je telefoon buiten handbereik. Dan sta je al half naast je bed als de wekker gaat."}, {"type": "knop", "tekst": "Ontdek Mooove", "url": "https://www.mooove-app.com/"}, {"type": "handtekening", "tekst": "Hylke\nMaker van Mooove"}]'::jsonb, '{"talen": ["nl"]}'::jsonb, 'stop-snooze'),
  ('The Morning MOOOVE #1 — stop-snooze (en)', 'en', 'Why the snooze button hijacks your morning', 'And what you can do differently tomorrow.', '[{"type": "titel", "tekst": "Stop hitting snooze"}, {"type": "alinea", "tekst": "Sound familiar? The alarm goes off, you hit snooze, and twenty minutes later you wake up in a rush. You’re not alone: for many people snooze is the first decision of the day, and the easiest one."}, {"type": "alinea", "tekst": "Mooove flips that around. Your alarm only stops after a short mission: ten squats, opening the curtains or making your bed. You choose how strict: from Free (a simple stop button) to Hardcore (with an awake check after five minutes)."}, {"type": "alinea", "tekst": "Tip for tomorrow: put your phone out of reach. You’ll already be halfway out of bed when the alarm rings."}, {"type": "knop", "tekst": "Discover Mooove", "url": "https://www.mooove-app.com/en/"}, {"type": "handtekening", "tekst": "Hylke\nMaker of Mooove"}]'::jsonb, '{"talen": ["en"]}'::jsonb, 'stop-snooze'),
  ('The Morning MOOOVE #2 — 7-dagen-challenge (nl)', 'nl', 'De 7-dagen ochtendchallenge', 'Elke ochtend één kleine actie. Doe je mee?', '[{"type": "titel", "tekst": "7 ochtenden, 7 kleine stappen"}, {"type": "alinea", "tekst": "Grote voornemens houden het zelden vol. Kleine acties wel. Daarom deze week een challenge: elke ochtend één ding, direct na het opstaan."}, {"type": "alinea", "tekst": "Dag 1: gordijnen open. Dag 2: tien squats. Dag 3: bed opmaken. Dag 4: tien jumping jacks. Dag 5: twintig seconden plank. Dag 6: een glas water. Dag 7: kies je favoriet en maak er je vaste missie van."}, {"type": "alinea", "tekst": "In Mooove kun je precies deze missies aan je wekker koppelen, met de optie \"wisselend\" krijg je zelfs elke ochtend een andere."}, {"type": "knop", "tekst": "Doe mee met Mooove", "url": "https://www.mooove-app.com/"}, {"type": "handtekening", "tekst": "Hylke\nMaker van Mooove"}]'::jsonb, '{"talen": ["nl"]}'::jsonb, '7-dagen-challenge'),
  ('The Morning MOOOVE #2 — 7-dagen-challenge (en)', 'en', 'The 7-day morning challenge', 'One small action every morning. Are you in?', '[{"type": "titel", "tekst": "7 mornings, 7 small steps"}, {"type": "alinea", "tekst": "Big resolutions rarely last. Small actions do. So this week, a challenge: one thing every morning, right after you get up."}, {"type": "alinea", "tekst": "Day 1: open the curtains. Day 2: ten squats. Day 3: make your bed. Day 4: ten jumping jacks. Day 5: a twenty-second plank. Day 6: a glass of water. Day 7: pick your favourite and make it your daily mission."}, {"type": "alinea", "tekst": "In Mooove you can attach exactly these missions to your alarm, and with the \"rotating\" option you even get a different one every morning."}, {"type": "knop", "tekst": "Join with Mooove", "url": "https://www.mooove-app.com/en/"}, {"type": "handtekening", "tekst": "Hylke\nMaker of Mooove"}]'::jsonb, '{"talen": ["en"]}'::jsonb, '7-dagen-challenge'),
  ('The Morning MOOOVE #3 — 2-minuten-start (nl)', 'nl', 'Een start van 2 minuten die je ochtend verandert', 'Laagdrempelig, zonder sportschool.', '[{"type": "titel", "tekst": "Twee minuten is genoeg"}, {"type": "alinea", "tekst": "Je hoeft niet om half zes te gaan hardlopen om goed aan de dag te beginnen. Twee minuten bewegen direct na het opstaan maakt al verschil in hoe wakker je je voelt."}, {"type": "alinea", "tekst": "Probeer dit: sta op, zet de gordijnen open, doe tien squats en drink een glas water. Klaar. Geen apparatuur, geen sportkleding."}, {"type": "alinea", "tekst": "Met Mooove wordt dit vanzelf je routine: je wekker vraagt erom, en de camera telt je herhalingen op je eigen toestel. Beelden worden nooit opgeslagen of verstuurd."}, {"type": "knop", "tekst": "Probeer Mooove", "url": "https://www.mooove-app.com/"}, {"type": "handtekening", "tekst": "Hylke\nMaker van Mooove"}]'::jsonb, '{"talen": ["nl"]}'::jsonb, '2-minuten-start'),
  ('The Morning MOOOVE #3 — 2-minuten-start (en)', 'en', 'A 2-minute start that changes your morning', 'Easy, no gym required.', '[{"type": "titel", "tekst": "Two minutes is enough"}, {"type": "alinea", "tekst": "You don’t need to go running at 5:30 to start your day well. Two minutes of movement right after getting up already makes a difference in how awake you feel."}, {"type": "alinea", "tekst": "Try this: get up, open the curtains, do ten squats and drink a glass of water. Done. No equipment, no gym clothes."}, {"type": "alinea", "tekst": "With Mooove this becomes your routine automatically: your alarm asks for it, and the camera counts your reps on your own device. Images are never stored or sent."}, {"type": "knop", "tekst": "Try Mooove", "url": "https://www.mooove-app.com/en/"}, {"type": "handtekening", "tekst": "Hylke\nMaker of Mooove"}]'::jsonb, '{"talen": ["en"]}'::jsonb, '2-minuten-start'),
  ('The Morning MOOOVE #4 — kies-je-missie (nl)', 'nl', 'Welke wekmissie past bij jou?', 'Van squats tot je bed opmaken.', '[{"type": "titel", "tekst": "Kies je wekmissie"}, {"type": "alinea", "tekst": "Niet iedereen wordt wakker van hetzelfde. Daarom heeft Mooove verschillende soorten missies."}, {"type": "alinea", "tekst": "Beweging: squats, push-ups, jumping jacks, lunges of een plank; de camera herkent je houding en telt mee. Ochtendroutine: de gordijnen open (Mooove meet of het lichter wordt) of je bed opmaken (met een foto als bevestiging). En je kunt eigen missies maken met een timer of foto."}, {"type": "alinea", "tekst": "Onze tip: begin met de gordijnen. Daglicht helpt, en je staat meteen naast je bed."}, {"type": "knop", "tekst": "Bekijk alle missies", "url": "https://www.mooove-app.com/"}, {"type": "handtekening", "tekst": "Hylke\nMaker van Mooove"}]'::jsonb, '{"talen": ["nl"]}'::jsonb, 'kies-je-missie'),
  ('The Morning MOOOVE #4 — kies-je-missie (en)', 'en', 'Which wake-up mission suits you?', 'From squats to making your bed.', '[{"type": "titel", "tekst": "Pick your wake-up mission"}, {"type": "alinea", "tekst": "Not everyone wakes up the same way. That’s why Mooove has different kinds of missions."}, {"type": "alinea", "tekst": "Movement: squats, push-ups, jumping jacks, lunges or a plank; the camera recognises your posture and counts along. Morning routine: open the curtains (Mooove checks that it gets brighter) or make your bed (with a photo as confirmation). And you can create your own missions with a timer or photo."}, {"type": "alinea", "tekst": "Our tip: start with the curtains. Daylight helps, and you’re out of bed straight away."}, {"type": "knop", "tekst": "See all missions", "url": "https://www.mooove-app.com/en/"}, {"type": "handtekening", "tekst": "Hylke\nMaker of Mooove"}]'::jsonb, '{"talen": ["en"]}'::jsonb, 'kies-je-missie'),
  ('The Morning MOOOVE #5 — bouw-je-streak (nl)', 'nl', 'Zo bouw je een ochtendstreak die blijft', 'Gewoonte maak je niet in één dag.', '[{"type": "titel", "tekst": "Bouw je streak"}, {"type": "alinea", "tekst": "Een gewoonte ontstaat door herhaling, niet door perfectie. Daarom telt Mooove je streak: het aantal ochtenden achter elkaar dat je je missie haalt."}, {"type": "alinea", "tekst": "Je kiest een weekdoel, bijvoorbeeld vijf ochtenden per week. Rustdagen tellen dan niet tegen je. En mis je toch een keer een dag, dan vangt de maandelijkse joker die automatisch op."}, {"type": "alinea", "tekst": "Badges en mijlpalen laten zien hoe ver je al bent. Klein beginnen is prima: drie ochtenden per week is een prima start."}, {"type": "knop", "tekst": "Start je streak", "url": "https://www.mooove-app.com/"}, {"type": "handtekening", "tekst": "Hylke\nMaker van Mooove"}]'::jsonb, '{"talen": ["nl"]}'::jsonb, 'bouw-je-streak'),
  ('The Morning MOOOVE #5 — bouw-je-streak (en)', 'en', 'How to build a morning streak that sticks', 'Habits aren’t built in a day.', '[{"type": "titel", "tekst": "Build your streak"}, {"type": "alinea", "tekst": "A habit grows through repetition, not perfection. That’s why Mooove counts your streak: the number of mornings in a row you complete your mission."}, {"type": "alinea", "tekst": "You choose a weekly goal, say five mornings a week. Rest days then don’t count against you. And if you do miss a day, the monthly joker covers it automatically."}, {"type": "alinea", "tekst": "Badges and milestones show how far you’ve come. Starting small is fine: three mornings a week is a great start."}, {"type": "knop", "tekst": "Start your streak", "url": "https://www.mooove-app.com/en/"}, {"type": "handtekening", "tekst": "Hylke\nMaker of Mooove"}]'::jsonb, '{"talen": ["en"]}'::jsonb, 'bouw-je-streak'),
  ('The Morning MOOOVE #6 — na-14-dagen (nl)', 'nl', 'Wat gebeurt er na 14 dagen Mooove?', 'Gratis en Premium, helder uitgelegd.', '[{"type": "titel", "tekst": "Na je proefperiode"}, {"type": "alinea", "tekst": "Je eerste alarm start een proefperiode van 14 dagen. Je hoeft geen betaalgegevens in te vullen."}, {"type": "alinea", "tekst": "Daarna kies je zelf. Gratis blijft Mooove een gewone wekker met maximaal twee alarmen. Met Premium houd je alle missies, alle niveaus en je volledige voortgang: per maand, per jaar of één keer voor altijd."}, {"type": "alinea", "tekst": "Je alarmen blijven bewaard, wat je ook kiest. De actuele prijzen zie je in de app."}, {"type": "knop", "tekst": "Meer over Mooove", "url": "https://www.mooove-app.com/"}, {"type": "handtekening", "tekst": "Hylke\nMaker van Mooove"}]'::jsonb, '{"talen": ["nl"]}'::jsonb, 'na-14-dagen'),
  ('The Morning MOOOVE #6 — na-14-dagen (en)', 'en', 'What happens after 14 days of Mooove?', 'Free and Premium, clearly explained.', '[{"type": "titel", "tekst": "After your trial"}, {"type": "alinea", "tekst": "Your first alarm starts a 14-day trial. No payment details needed."}, {"type": "alinea", "tekst": "Then it’s up to you. On the free plan Mooove stays a regular alarm clock with up to two alarms. With Premium you keep all missions, all levels and your full progress: monthly, yearly or once for life."}, {"type": "alinea", "tekst": "Your alarms are kept whatever you choose. You’ll find current prices in the app."}, {"type": "knop", "tekst": "More about Mooove", "url": "https://www.mooove-app.com/en/"}, {"type": "handtekening", "tekst": "Hylke\nMaker of Mooove"}]'::jsonb, '{"talen": ["en"]}'::jsonb, 'na-14-dagen');
