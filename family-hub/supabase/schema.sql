-- Family Hub household lists.
-- Run once in the Supabase SQL Editor on an empty project.
-- This file has no project URL and no API key.
--
-- The Next.js server uses the secret key (service_role). That role bypasses
-- row level security. The browser never receives the key. anon and
-- authenticated have no grants and no policies, so a publishable key cannot
-- read these tables. Google sign-in is a later slice.

begin;

create table if not exists public.todos (
  id text primary key,
  person_id text not null check (person_id in ('knut', 'ulla', 'amelia', 'hedda', 'maja')),
  title text not null check (char_length(title) between 1 and 200),
  -- PRD 5.3. The current screens edit the title only, so this stays empty.
  description text not null default '',
  -- Shown as typed ("31.10 · Tesla Model X", "i morgen"). Not always a date.
  due_label text,
  done boolean not null default false,
  overdue boolean not null default false,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists todos_person_sort on public.todos (person_id, sort_order);

create table if not exists public.dinner_week (
  id text primary key,
  starts_on date not null,
  period text not null
);

create table if not exists public.dinner_days (
  id text primary key check (id in ('man', 'tir', 'ons', 'tor', 'fre', 'lor', 'son')),
  weekday text not null,
  date_label text not null,
  sort_order integer not null,
  meal_id text,
  meal_title text,
  meal_minutes integer,
  meal_diets text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint dinner_days_meal_pair check (
    (meal_id is null and meal_title is null and meal_minutes is null)
    or (meal_id is not null and meal_title is not null and meal_minutes is not null)
  )
);

create table if not exists public.shopping_aisles (
  id text primary key,
  label text not null,
  sort_order integer not null
);

create table if not exists public.shopping_items (
  id text primary key,
  aisle_id text not null references public.shopping_aisles (id),
  name text not null check (char_length(name) between 1 and 200),
  quantity text not null check (char_length(quantity) between 1 and 40),
  done boolean not null default false,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists shopping_items_aisle_sort on public.shopping_items (aisle_id, sort_order);

-- One transaction for a drag that moves meals between days.
create or replace function public.save_dinner_days(days jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  row jsonb;
begin
  if jsonb_typeof(days) <> 'array' then
    raise exception 'days must be an array';
  end if;

  for row in select value from jsonb_array_elements(days)
  loop
    if not exists (select 1 from public.dinner_days where id = row->>'id') then
      raise exception 'unknown dinner day';
    end if;

    update public.dinner_days as day
    set
      meal_id = case
        when row->'meal' is null or jsonb_typeof(row->'meal') = 'null' then null
        else row #>> '{meal,id}'
      end,
      meal_title = case
        when row->'meal' is null or jsonb_typeof(row->'meal') = 'null' then null
        else row #>> '{meal,title}'
      end,
      meal_minutes = case
        when row->'meal' is null or jsonb_typeof(row->'meal') = 'null' then null
        else (row #>> '{meal,minutes}')::integer
      end,
      meal_diets = case
        when row->'meal' is null or jsonb_typeof(row->'meal') = 'null' then '{}'::text[]
        else (
          select coalesce(array_agg(elem order by ord), '{}'::text[])
          from jsonb_array_elements_text(coalesce(row #> '{meal,diets}', '[]'::jsonb)) with ordinality as listed(elem, ord)
        )
      end,
      updated_at = now()
    where day.id = row->>'id';
  end loop;
end;
$$;

insert into public.dinner_week (id, starts_on, period)
values ('current', '2026-09-28', '28.09 – 04.10')
on conflict (id) do nothing;

insert into public.dinner_days (id, weekday, date_label, sort_order, meal_id, meal_title, meal_minutes, meal_diets)
values
  ('man', 'mandag', '28.09', 0, 'wok', 'Kyllingwok med nudler', 30, array['Glutenfri']::text[]),
  ('tir', 'tirsdag', '29.09', 1, 'laks-pasta', 'Laksepasta', 25, array['Glutenfri', 'Laktosefri']::text[]),
  ('ons', 'onsdag', '30.09', 2, 'kjottkaker', 'Kjøttkaker med potetmos', 45, array['Glutenfri']::text[]),
  ('tor', 'torsdag', '01.10', 3, 'linsesuppe', 'Linsesuppe', 35, array['Glutenfri', 'Laktosefri']::text[]),
  ('fre', 'fredag', '02.10', 4, null, null, null, '{}'::text[]),
  ('lor', 'lørdag', '03.10', 5, 'ovnslaks', 'Ovnsbakt laks med poteter', 35, array['Glutenfri', 'Laktosefri']::text[]),
  ('son', 'søndag', '04.10', 6, 'fiskegrateng', 'Fiskegrateng', 40, array['Glutenfri']::text[])
on conflict (id) do nothing;

insert into public.shopping_aisles (id, label, sort_order)
values
  ('gront', 'Frukt og grønt', 0),
  ('kjott', 'Kjøtt og fisk', 1),
  ('meieri', 'Meieri, laktosefritt', 2),
  ('glutenfritt', 'Glutenfritt', 3)
on conflict (id) do nothing;

insert into public.shopping_items (id, aisle_id, name, quantity, done, sort_order)
values
  ('paprika', 'gront', 'Paprika', '2 stk', false, 0),
  ('gulrot', 'gront', 'Gulrøtter', '1 pose', false, 1),
  ('lok', 'gront', 'Løk', '3 stk', true, 2),
  ('sitron', 'gront', 'Sitron', '2 stk', false, 3),
  ('laks', 'kjott', 'Laksefilet', '800 g', false, 0),
  ('kylling', 'kjott', 'Kyllingfilet', '600 g', false, 1),
  ('kjottdeig', 'kjott', 'Kjøttdeig', '400 g', false, 2),
  ('melk', 'meieri', 'Melk', '1 l', false, 0),
  ('smor', 'meieri', 'Smør', '1 pk', true, 1),
  ('ost', 'meieri', 'Revet ost', '1 pk', false, 2),
  ('nudler', 'glutenfritt', 'Nudler', '2 pk', false, 0),
  ('pasta', 'glutenfritt', 'Pasta', '1 pk', false, 1),
  ('skjell', 'glutenfritt', 'Taco-skjell', '1 pk', false, 2),
  ('linser', 'glutenfritt', 'Linser', '1 pk', false, 3)
on conflict (id) do nothing;

insert into public.todos (id, person_id, title, description, due_label, done, overdue, sort_order)
values
  ('knut-eu', 'knut', 'Bestille EU-kontroll', '', '31.10 · Tesla Model X', false, false, 0),
  ('knut-pass', 'knut', 'Fornye pass for Maja', '', '12.11', false, false, 1),
  ('knut-dekk', 'knut', 'Sjekke dekk før hyttetur', '', 'i morgen', false, false, 2),
  ('knut-kontingent', 'knut', 'Betale håndball-kontingent', '', null, true, false, 3),
  ('ulla-samtykke', 'ulla', 'Svare på leirskole-samtykke', '', '06.10 · Maja · Jar skole', false, false, 0),
  ('ulla-mote', 'ulla', 'Melde på foreldremøte 8B', '', '09.10', false, false, 1),
  ('ulla-gave', 'ulla', 'Kjøpe gave til tvillingene', '', '18.10', false, false, 2),
  ('amelia-bag', 'amelia', 'Pakke håndballbag', '', 'i dag', false, false, 0),
  ('amelia-prove', 'amelia', 'Lese til naturfagsprøve', '', 'tirsdag', false, false, 1),
  ('hedda-norsk', 'hedda', 'Levere innlevering i norsk', '', 'i går', false, true, 0),
  ('hedda-hytte', 'hedda', 'Pakke til hytta', '', 'søndag', false, false, 1),
  ('maja-cheer', 'maja', 'Øve på cheer-rutine', '', 'i dag', false, false, 0),
  ('maja-rom', 'maja', 'Rydde rommet', '', null, false, false, 1)
on conflict (id) do nothing;

alter table public.todos enable row level security;
alter table public.dinner_week enable row level security;
alter table public.dinner_days enable row level security;
alter table public.shopping_aisles enable row level security;
alter table public.shopping_items enable row level security;

revoke all on table public.todos from anon, authenticated;
revoke all on table public.dinner_week from anon, authenticated;
revoke all on table public.dinner_days from anon, authenticated;
revoke all on table public.shopping_aisles from anon, authenticated;
revoke all on table public.shopping_items from anon, authenticated;

grant select, insert, update, delete on table public.todos to service_role;
grant select, insert, update, delete on table public.dinner_week to service_role;
grant select, insert, update, delete on table public.dinner_days to service_role;
grant select, insert, update, delete on table public.shopping_aisles to service_role;
grant select, insert, update, delete on table public.shopping_items to service_role;

revoke all on function public.save_dinner_days(jsonb) from public;
revoke all on function public.save_dinner_days(jsonb) from anon, authenticated;
grant execute on function public.save_dinner_days(jsonb) to service_role;

commit;
