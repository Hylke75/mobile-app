-- Freemium: proefperiode (eenmalig, start bij het eerste alarm) en Premium-toegang.
alter table public.profiles
  add column proef_start timestamptz,
  add column premium_tot timestamptz,
  add column premium_altijd boolean not null default false;

-- Gebruikers mogen hun eigen proef- en Premium-velden niet wijzigen; alleen de server
-- (start_proef, beheer, later de aankoop-webhook) mag dat.
create or replace function public.bewaak_premium()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.proef_start := old.proef_start;
    new.premium_tot := old.premium_tot;
    new.premium_altijd := old.premium_altijd;
  end if;
  return new;
end;
$$;

revoke execute on function public.bewaak_premium() from public, anon, authenticated;

create trigger profiles_bewaak_premium
  before update on public.profiles
  for each row execute function public.bewaak_premium();

-- Start de proefperiode van de ingelogde gebruiker één keer; geeft het (bestaande) startmoment terug.
create or replace function public.start_proef()
returns timestamptz
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set proef_start = coalesce(proef_start, now())
  where id = (select auth.uid())
  returning proef_start;
$$;

revoke execute on function public.start_proef() from public, anon;
grant execute on function public.start_proef() to authenticated;

-- Iedereen die vóór de invoering van het verdienmodel een account had, is tester:
-- blijvend volledige toegang.
update public.profiles set premium_altijd = true;
