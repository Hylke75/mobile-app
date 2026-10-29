-- Groei en beheer: verwijzingscodes (een vriend uitnodigen), een opschoonfunctie voor de
-- bewaartermijnen en een statusfunctie voor het beheer. Tabellen alleen via functies bereikbaar
-- (RLS aan, geen policies).

-- ===== Verwijzingen: beide accounts krijgen 30 dagen Premium =====
create table public.verwijzingscodes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  created_at timestamptz not null default now()
);

create table public.verwijzingen (
  id uuid primary key default gen_random_uuid(),
  code_eigenaar uuid references auth.users (id) on delete set null,
  -- Elk account kan maar één keer een code verzilveren
  nieuwe_gebruiker uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index verwijzingen_eigenaar on public.verwijzingen (code_eigenaar);

alter table public.verwijzingscodes enable row level security;
alter table public.verwijzingen enable row level security;
revoke all on public.verwijzingscodes, public.verwijzingen from anon, authenticated;

-- De eigen code (wordt de eerste keer aangemaakt). Zonder 0/O/1/I, zodat hij goed over te typen is.
create or replace function public.mijn_verwijzingscode()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  gebruiker uuid := (select auth.uid());
  bestaand text;
  nieuw text;
  tekens constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if gebruiker is null then
    return null;
  end if;
  select code into bestaand from public.verwijzingscodes where user_id = gebruiker;
  if bestaand is not null then
    return bestaand;
  end if;
  loop
    nieuw := '';
    for i in 1..6 loop
      nieuw := nieuw || substr(tekens, 1 + floor(random() * length(tekens))::int, 1);
    end loop;
    begin
      insert into public.verwijzingscodes (user_id, code) values (gebruiker, nieuw);
      return nieuw;
    exception when unique_violation then
      -- Code al in gebruik (of tegelijk aangemaakt): opnieuw
      select code into bestaand from public.verwijzingscodes where user_id = gebruiker;
      if bestaand is not null then
        return bestaand;
      end if;
    end;
  end loop;
end;
$$;

-- Code van een vriend verzilveren: binnen 14 dagen na het aanmaken van je account, één keer.
-- De nieuwe gebruiker krijgt altijd 30 dagen Premium, de uitnodiger tot 12 keer.
create or replace function public.verzilver_code(invoer text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  gebruiker uuid := (select auth.uid());
  eigenaar uuid;
  aangemaakt timestamptz;
  beloond integer;
begin
  if gebruiker is null then
    return 'ongeldig';
  end if;
  select created_at into aangemaakt from public.profiles where id = gebruiker;
  if aangemaakt is null or aangemaakt < now() - interval '14 days' then
    return 'te_laat';
  end if;
  select user_id into eigenaar from public.verwijzingscodes where code = upper(trim(invoer));
  if eigenaar is null then
    return 'ongeldig';
  end if;
  if eigenaar = gebruiker then
    return 'eigen';
  end if;
  begin
    insert into public.verwijzingen (code_eigenaar, nieuwe_gebruiker) values (eigenaar, gebruiker);
  exception when unique_violation then
    return 'al';
  end;
  update public.profiles
  set premium_tot = greatest(coalesce(premium_tot, now()), now()) + interval '30 days'
  where id = gebruiker;
  select count(*) into beloond from public.verwijzingen where code_eigenaar = eigenaar;
  if beloond <= 12 then
    update public.profiles
    set premium_tot = greatest(coalesce(premium_tot, now()), now()) + interval '30 days'
    where id = eigenaar;
  end if;
  insert into public.marketing_events (subject_user_id, event_name, event_source, properties)
  values (gebruiker, 'referral_redeemed', 'server', jsonb_build_object('beloond', beloond <= 12));
  return 'ok';
end;
$$;

revoke execute on function public.mijn_verwijzingscode() from public, anon;
revoke execute on function public.verzilver_code(text) from public, anon;
grant execute on function public.mijn_verwijzingscode() to authenticated;
grant execute on function public.verzilver_code(text) to authenticated;

-- ===== Bewaartermijnen: dagelijks opschonen (pg_cron, zie docs/marketing/SETUP.md) =====
create or replace function public.marketing_opschonen()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultaat jsonb := '{}'::jsonb;
  n integer;
begin
  -- Misbruikrem (gehashte IP's): 2 dagen
  delete from public.misbruikrem where created_at < now() - interval '2 days';
  get diagnostics n = row_count; resultaat := resultaat || jsonb_build_object('misbruikrem', n);
  -- Verzonden/overgeslagen mail en bezorgmeldingen: 90 dagen
  delete from public.email_outbox
  where status in ('sent', 'skipped', 'cancelled', 'dead') and updated_at < now() - interval '90 days';
  get diagnostics n = row_count; resultaat := resultaat || jsonb_build_object('outbox', n);
  delete from public.email_delivery_events where created_at < now() - interval '90 days';
  get diagnostics n = row_count; resultaat := resultaat || jsonb_build_object('bezorging', n);
  -- Nooit bevestigde nieuwsbriefaanmeldingen: na 30 dagen helemaal weg
  delete from public.marketing_contacts c
  where c.created_at < now() - interval '30 days'
    and not exists (
      select 1 from public.marketing_consents mc where mc.contact_id = c.id and mc.status <> 'pending'
    );
  get diagnostics n = row_count; resultaat := resultaat || jsonb_build_object('onbevestigd', n);
  -- Gebeurtenissen voor de funnel: 25 maanden; logboeken: 1 en 2 jaar
  delete from public.marketing_events where occurred_at < now() - interval '25 months';
  get diagnostics n = row_count; resultaat := resultaat || jsonb_build_object('events', n);
  delete from public.beheer_log where created_at < now() - interval '1 year';
  get diagnostics n = row_count; resultaat := resultaat || jsonb_build_object('beheer_log', n);
  delete from public.marketing_audit_logs where created_at < now() - interval '2 years';
  get diagnostics n = row_count; resultaat := resultaat || jsonb_build_object('auditlog', n);
  insert into public.marketing_audit_logs (actie, object_type, samenvatting)
  values ('opschonen', 'systeem', left(resultaat::text, 300));
  return resultaat;
end;
$$;

revoke execute on function public.marketing_opschonen() from public, anon, authenticated;
grant execute on function public.marketing_opschonen() to service_role;

-- ===== Status voor het beheer: laatste runs van de geplande taken (als pg_cron aan staat) =====
create or replace function public.beheer_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  taken jsonb := '[]'::jsonb;
begin
  if to_regclass('cron.job_run_details') is not null then
    execute $q$
      select coalesce(jsonb_agg(jsonb_build_object(
        'taak', j.jobname, 'schema', j.schedule, 'actief', j.active,
        'laatste', r.start_time, 'status', r.status)), '[]'::jsonb)
      from cron.job j
      left join lateral (
        select start_time, status from cron.job_run_details d
        where d.jobid = j.jobid order by start_time desc limit 1
      ) r on true
      where j.jobname like 'mooove-%'
    $q$ into taken;
  end if;
  return jsonb_build_object(
    'taken', taken,
    'laatsteBezorgmelding', (select max(created_at) from public.email_delivery_events),
    'laatsteWinkelmelding', (
      select max(created_at) from public.marketing_events where event_source = 'store'
    )
  );
end;
$$;

revoke execute on function public.beheer_status() from public, anon, authenticated;
grant execute on function public.beheer_status() to service_role;
