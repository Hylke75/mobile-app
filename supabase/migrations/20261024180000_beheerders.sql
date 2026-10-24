-- Beheerders van Mooove: alleen zij kunnen via de Edge Function admin-overzicht het
-- gebruikersoverzicht opvragen. Toevoegen gaat met de hand (zie docs/supabase-instellingen.md).
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Alleen je eigen beheerrol is zichtbaar; toevoegen of wijzigen kan niet via de API
create policy "Eigen beheerrol lezen" on public.admins
  for select to authenticated
  using ((select auth.uid()) = user_id);
