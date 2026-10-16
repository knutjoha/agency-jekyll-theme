-- Family Hub Verdi (v1.1 chores / allowance).
-- Run once in the Supabase SQL Editor. Do not re-run schema.sql.
-- This file has no project URL and no API key.
-- BASE_NOK is 50 in the app, not stored here.
-- person_id 'pool' is the shared extras lane. done is only meaningful on a daughter.

begin;

create table if not exists public.verdi_week (
  id text primary key,
  locked boolean not null default false,
  locked_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.verdi_skips (
  week_id text not null references public.verdi_week (id) on delete cascade,
  person_id text not null check (person_id in ('amelia', 'hedda', 'maja')),
  skips integer not null default 0 check (skips >= 0),
  updated_at timestamptz not null default now(),
  primary key (week_id, person_id)
);

create table if not exists public.verdi_extras (
  id text primary key,
  week_id text not null references public.verdi_week (id) on delete cascade,
  person_id text not null check (person_id in ('amelia', 'hedda', 'maja', 'pool')),
  title text not null check (char_length(title) between 1 and 200),
  amount_nok integer not null check (amount_nok >= 1),
  done boolean not null default false,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists verdi_extras_week_person_sort
  on public.verdi_extras (week_id, person_id, sort_order);

create table if not exists public.verdi_basics (
  id text primary key check (id in ('gangen', 'gymbag', 'matpakke', 'rommet')),
  title text not null check (char_length(title) between 1 and 200),
  sort_order integer not null
);

insert into public.verdi_basics (id, title, sort_order)
values
  ('gangen', 'Ryddig i gangen', 0),
  ('gymbag', 'Ta ut av gymbagen', 1),
  ('matpakke', 'Ta opp matpakke', 2),
  ('rommet', 'Rydde rommet på fredag', 3)
on conflict (id) do nothing;

alter table public.verdi_week enable row level security;
alter table public.verdi_skips enable row level security;
alter table public.verdi_extras enable row level security;
alter table public.verdi_basics enable row level security;

revoke all on table public.verdi_week from anon, authenticated;
revoke all on table public.verdi_skips from anon, authenticated;
revoke all on table public.verdi_extras from anon, authenticated;
revoke all on table public.verdi_basics from anon, authenticated;

grant select, insert, update, delete on table public.verdi_week to service_role;
grant select, insert, update, delete on table public.verdi_skips to service_role;
grant select, insert, update, delete on table public.verdi_extras to service_role;
grant select, insert, update, delete on table public.verdi_basics to service_role;

commit;
