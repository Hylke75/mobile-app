-- Proeffunnel: gebeurtenissen uit de app (eerste alarm, eerste missie, betaalscherm, aankoop).
-- De app kan marketing_events niet zelf schrijven (RLS zonder policies); deze functie accepteert
-- alleen bekende gebeurtenissen van de ingelogde gebruiker, klein en eenmalig per extern_id.

create or replace function public.log_app_event(
  naam text,
  eigenschappen jsonb default '{}'::jsonb,
  extern_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return;
  end if;
  if naam not in (
    'first_alarm_created',
    'first_mission_completed',
    'day7_active',
    'paywall_viewed',
    'purchase_started',
    'purchase_completed',
    'premium_moment_shown'
  ) then
    raise exception 'Onbekende gebeurtenis';
  end if;
  if pg_column_size(coalesce(eigenschappen, '{}'::jsonb)) > 1024 then
    raise exception 'Eigenschappen te groot';
  end if;
  insert into public.marketing_events (subject_user_id, event_name, event_source, external_event_id, properties)
  values ((select auth.uid()), naam, 'app', left(extern_id, 120), coalesce(eigenschappen, '{}'::jsonb))
  on conflict (event_source, external_event_id) do nothing;
end;
$$;

revoke execute on function public.log_app_event(text, jsonb, text) from public, anon;
grant execute on function public.log_app_event(text, jsonb, text) to authenticated;

-- De proef start op de server; daar ook de gebeurtenis vastleggen (eenmalig per account)
create or replace function public.start_proef()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  begin_proef timestamptz;
  was_gestart boolean;
begin
  select proef_start is not null into was_gestart from public.profiles where id = (select auth.uid());
  update public.profiles
  set proef_start = coalesce(proef_start, now())
  where id = (select auth.uid())
  returning proef_start into begin_proef;
  if begin_proef is not null and not coalesce(was_gestart, false) then
    insert into public.marketing_events (subject_user_id, event_name, event_source, external_event_id)
    values ((select auth.uid()), 'trial_started', 'server', 'trial_started:' || (select auth.uid()))
    on conflict (event_source, external_event_id) do nothing;
  end if;
  return begin_proef;
end;
$$;

revoke execute on function public.start_proef() from public, anon;
grant execute on function public.start_proef() to authenticated;
