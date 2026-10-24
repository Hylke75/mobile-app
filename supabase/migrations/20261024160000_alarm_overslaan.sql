-- Eén keer overslaan: het alarm gaat op deze datum niet af; null = niet overgeslagen
alter table public.alarms add column overslaan_op date;
