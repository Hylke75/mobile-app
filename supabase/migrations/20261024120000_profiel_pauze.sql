-- Alle alarmen gepauzeerd tot en met deze datum (bijv. vakantie); null = geen pauze
alter table public.profiles add column pauze_tot date;
