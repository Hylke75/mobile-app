-- Index op de beheerder in het beheerlog (Supabase-advisor: unindexed foreign key)
create index if not exists beheer_log_beheerder_id_idx on public.beheer_log (beheerder_id);
