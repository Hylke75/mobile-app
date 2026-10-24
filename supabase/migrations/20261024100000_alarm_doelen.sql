-- Eigen aantal herhalingen of seconden per oefening, bijv. {"Squats": 15, "Plank": 45}
alter table public.alarms
  add column doelen jsonb not null default '{}'::jsonb
  check (jsonb_typeof(doelen) = 'object');
