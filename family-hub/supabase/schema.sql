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
  -- Calendar frist. The screen derives the label from this date and does not read due_label.
  due_on date,
  done boolean not null default false,
  overdue boolean not null default false,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists todos_person_sort on public.todos (person_id, sort_order);

create table if not exists public.dinner_week (
  id text primary key,
  starts_on date not null unique,
  period text not null
);

create table if not exists public.dinner_days (
  week_id text not null references public.dinner_week (id),
  id text not null check (id in ('man', 'tir', 'ons', 'tor', 'fre', 'lor', 'son')),
  weekday text not null,
  date_label text not null,
  sort_order integer not null,
  meal_id text,
  meal_title text,
  meal_minutes integer,
  updated_at timestamptz not null default now(),
  primary key (week_id, id),
  unique (week_id, meal_id),
  constraint dinner_days_meal_pair check (
    (meal_id is null and meal_title is null and meal_minutes is null)
    or (meal_id is not null and meal_title is not null and meal_minutes is not null)
  )
);

create table if not exists public.dinner_ingredients (
  week_id text not null references public.dinner_week (id),
  meal_id text not null,
  id text not null,
  name text not null check (char_length(name) between 1 and 200),
  amount text not null check (char_length(amount) between 1 and 40),
  sort_order integer not null,
  primary key (week_id, meal_id, id)
);

create table if not exists public.shopping_aisles (
  id text primary key,
  label text not null,
  sort_order integer not null
);

create table if not exists public.shopping_items (
  id text primary key,
  aisle_id text not null references public.shopping_aisles (id),
  week_id text not null references public.dinner_week (id),
  origin text not null check (origin in ('manual', 'menu')),
  name text not null check (char_length(name) between 1 and 200),
  quantity text not null check (char_length(quantity) between 1 and 40),
  done boolean not null default false,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists shopping_items_week_aisle_sort on public.shopping_items (week_id, aisle_id, sort_order);

insert into public.dinner_week (id, starts_on, period)
values ('2026-09-28', '2026-09-28', '28.09 – 04.10')
on conflict (id) do nothing;

insert into public.dinner_days (week_id, id, weekday, date_label, sort_order, meal_id, meal_title, meal_minutes)
values
  ('2026-09-28', 'man', 'mandag', '28.09', 0, 'wok', 'Kyllingwok med nudler', 30),
  ('2026-09-28', 'tir', 'tirsdag', '29.09', 1, 'laks-pasta', 'Laksepasta', 25),
  ('2026-09-28', 'ons', 'onsdag', '30.09', 2, 'kjottkaker', 'Kjøttkaker med potetmos', 45),
  ('2026-09-28', 'tor', 'torsdag', '01.10', 3, 'linsesuppe', 'Linsesuppe', 35),
  ('2026-09-28', 'fre', 'fredag', '02.10', 4, null, null, null),
  ('2026-09-28', 'lor', 'lørdag', '03.10', 5, 'ovnslaks', 'Ovnsbakt laks med poteter', 35),
  ('2026-09-28', 'son', 'søndag', '04.10', 6, 'fiskegrateng', 'Fiskegrateng', 40)
on conflict (week_id, id) do nothing;

insert into public.shopping_aisles (id, label, sort_order)
values
  ('gront', 'Frukt og grønt', 0),
  ('kjott', 'Kjøtt og fisk', 1),
  ('meieri', 'Meieri, laktosefritt', 2),
  ('glutenfritt', 'Glutenfritt', 3),
  ('ukemeny', 'Fra ukemenyen', 4)
on conflict (id) do nothing;

insert into public.shopping_items (id, aisle_id, name, quantity, done, sort_order, week_id, origin)
values
  ('paprika', 'gront', 'Paprika', '2 stk', false, 0, '2026-09-28', 'manual'),
  ('gulrot', 'gront', 'Gulrøtter', '1 pose', false, 1, '2026-09-28', 'manual'),
  ('lok', 'gront', 'Løk', '3 stk', true, 2, '2026-09-28', 'manual'),
  ('sitron', 'gront', 'Sitron', '2 stk', false, 3, '2026-09-28', 'manual'),
  ('laks', 'kjott', 'Laksefilet', '800 g', false, 0, '2026-09-28', 'manual'),
  ('kylling', 'kjott', 'Kyllingfilet', '600 g', false, 1, '2026-09-28', 'manual'),
  ('kjottdeig', 'kjott', 'Kjøttdeig', '400 g', false, 2, '2026-09-28', 'manual'),
  ('melk', 'meieri', 'Melk', '1 l', false, 0, '2026-09-28', 'manual'),
  ('smor', 'meieri', 'Smør', '1 pk', true, 1, '2026-09-28', 'manual'),
  ('ost', 'meieri', 'Revet ost', '1 pk', false, 2, '2026-09-28', 'manual'),
  ('nudler', 'glutenfritt', 'Nudler', '2 pk', false, 0, '2026-09-28', 'manual'),
  ('pasta', 'glutenfritt', 'Pasta', '1 pk', false, 1, '2026-09-28', 'manual'),
  ('skjell', 'glutenfritt', 'Taco-skjell', '1 pk', false, 2, '2026-09-28', 'manual'),
  ('linser', 'glutenfritt', 'Linser', '1 pk', false, 3, '2026-09-28', 'manual')
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

-- Week saves. The live project gets these from dinner-weeks.sql instead of re-running this file.

create or replace function public.ensure_dinner_week(week text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  monday date;
begin
  if week !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'bad week';
  end if;
  monday := week::date;
  if to_char(monday, 'YYYY-MM-DD') <> week or extract(isodow from monday) <> 1 then
    raise exception 'week must be a Monday';
  end if;

  insert into public.dinner_week (id, starts_on, period)
  values (week, monday, to_char(monday, 'DD.MM') || ' – ' || to_char(monday + 6, 'DD.MM'))
  on conflict (id) do nothing;

  insert into public.dinner_days (week_id, id, weekday, date_label, sort_order)
  values
    (week, 'man', 'mandag', to_char(monday, 'DD.MM'), 0),
    (week, 'tir', 'tirsdag', to_char(monday + 1, 'DD.MM'), 1),
    (week, 'ons', 'onsdag', to_char(monday + 2, 'DD.MM'), 2),
    (week, 'tor', 'torsdag', to_char(monday + 3, 'DD.MM'), 3),
    (week, 'fre', 'fredag', to_char(monday + 4, 'DD.MM'), 4),
    (week, 'lor', 'lørdag', to_char(monday + 5, 'DD.MM'), 5),
    (week, 'son', 'søndag', to_char(monday + 6, 'DD.MM'), 6)
  on conflict (week_id, id) do nothing;
end;
$$;

create or replace function public.refresh_menu_shopping(week text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  done_pairs jsonb;
begin
  insert into public.shopping_aisles (id, label, sort_order)
  values ('ukemeny', 'Fra ukemenyen', 4)
  on conflict (id) do nothing;

  select coalesce(
    jsonb_agg(distinct jsonb_build_object('norm', lower(btrim(name)), 'amount', quantity)),
    '[]'::jsonb
  )
  into done_pairs
  from public.shopping_items
  where week_id = week
    and origin = 'menu'
    and done;

  delete from public.shopping_items
  where week_id = week
    and origin = 'menu';

  insert into public.shopping_items (id, aisle_id, week_id, origin, name, quantity, done, sort_order)
  select
    'menu-' || replace(week, '-', '') || '-' || lpad(line.ord::text, 3, '0'),
    'ukemeny',
    week,
    'menu',
    line.name,
    line.amount,
    done_pairs @> jsonb_build_array(jsonb_build_object('norm', line.norm_name, 'amount', line.amount)),
    line.ord - 1
  from (
    select
      picked.name,
      picked.amount,
      picked.norm_name,
      row_number() over (order by picked.day_order, picked.sort_order) as ord
    from (
      select distinct on (lower(btrim(ing.name)), ing.amount)
        ing.name,
        ing.amount,
        lower(btrim(ing.name)) as norm_name,
        day.sort_order as day_order,
        ing.sort_order
      from public.dinner_ingredients ing
      join public.dinner_days day
        on day.week_id = ing.week_id
       and day.meal_id = ing.meal_id
      where ing.week_id = week
      order by lower(btrim(ing.name)), ing.amount, day.sort_order, ing.sort_order
    ) as picked
  ) as line;
end;
$$;

create or replace function public.save_dinner_days(week text, days jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  row jsonb;
  meal_id text;
  meal_title text;
  meal_minutes integer;
  seen_meals text[] := '{}';
  seen_days text[] := '{}';
  old_meals text[];
  new_meals text[];
begin
  if jsonb_typeof(days) <> 'array' or jsonb_array_length(days) <> 7 then
    raise exception 'days must be seven';
  end if;

  for row in select value from jsonb_array_elements(days)
  loop
    if row->>'id' is null or row->>'id' not in ('man', 'tir', 'ons', 'tor', 'fre', 'lor', 'son') then
      raise exception 'unknown dinner day';
    end if;
    if row->>'id' = any (seen_days) then
      raise exception 'duplicate dinner day';
    end if;
    seen_days := seen_days || (row->>'id');

    if row->'meal' is null or jsonb_typeof(row->'meal') = 'null' then
      continue;
    end if;
    if jsonb_typeof(row->'meal') <> 'object' then
      raise exception 'bad meal';
    end if;

    meal_id := btrim(row #>> '{meal,id}');
    meal_title := btrim(row #>> '{meal,title}');
    if meal_id !~* '^[a-z0-9][a-z0-9-]{0,79}$' then
      raise exception 'bad meal id';
    end if;
    if meal_title is null or char_length(meal_title) < 1 or char_length(meal_title) > 200 then
      raise exception 'bad meal title';
    end if;
    if coalesce(row #>> '{meal,minutes}', '') !~ '^[0-9]+$' then
      raise exception 'bad minutes';
    end if;
    meal_minutes := (row #>> '{meal,minutes}')::integer;
    if meal_minutes < 1 or meal_minutes > 600 then
      raise exception 'bad minutes';
    end if;
    if meal_id = any (seen_meals) then
      raise exception 'duplicate meal id';
    end if;
    seen_meals := seen_meals || meal_id;
  end loop;

  perform public.ensure_dinner_week(week);

  select coalesce(array_agg(day.meal_id), '{}')
  into old_meals
  from public.dinner_days as day
  where day.week_id = week
    and day.meal_id is not null;

  update public.dinner_days
  set meal_id = null, meal_title = null, meal_minutes = null, updated_at = now()
  where week_id = week;

  for row in select value from jsonb_array_elements(days)
  loop
    if row->'meal' is null or jsonb_typeof(row->'meal') = 'null' then
      continue;
    end if;
    update public.dinner_days
    set
      meal_id = btrim(row #>> '{meal,id}'),
      meal_title = btrim(row #>> '{meal,title}'),
      meal_minutes = (row #>> '{meal,minutes}')::integer,
      updated_at = now()
    where week_id = week
      and id = row->>'id';
  end loop;

  delete from public.dinner_ingredients as ing
  where ing.week_id = week
    and not exists (
      select 1
      from public.dinner_days as day
      where day.week_id = week
        and day.meal_id = ing.meal_id
    );

  select coalesce(array_agg(day.meal_id), '{}')
  into new_meals
  from public.dinner_days as day
  where day.week_id = week
    and day.meal_id is not null;

  if exists (
    select 1
    from unnest(old_meals) as old_id
    where old_id <> all (new_meals)
  ) then
    perform public.refresh_menu_shopping(week);
  end if;
end;
$$;

create or replace function public.save_dinner_day(week text, day_id text, meal jsonb, ingredients jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  old_meal text;
  new_id text;
  new_title text;
  new_minutes integer;
  ing jsonb;
  seen_ids text[] := '{}';
  ing_id text;
  ing_name text;
  ing_amount text;
  ord integer := 0;
begin
  if day_id not in ('man', 'tir', 'ons', 'tor', 'fre', 'lor', 'son') then
    raise exception 'unknown dinner day';
  end if;
  if meal is null or jsonb_typeof(meal) <> 'object' then
    raise exception 'bad meal';
  end if;
  if jsonb_typeof(ingredients) <> 'array' then
    raise exception 'bad ingredients';
  end if;

  new_id := btrim(meal->>'id');
  new_title := btrim(meal->>'title');
  if new_id !~* '^[a-z0-9][a-z0-9-]{0,79}$' then
    raise exception 'bad meal id';
  end if;
  if new_title is null or char_length(new_title) < 1 or char_length(new_title) > 200 then
    raise exception 'bad meal title';
  end if;
  if coalesce(meal->>'minutes', '') !~ '^[0-9]+$' then
    raise exception 'bad minutes';
  end if;
  new_minutes := (meal->>'minutes')::integer;
  if new_minutes < 1 or new_minutes > 600 then
    raise exception 'bad minutes';
  end if;

  for ing in select value from jsonb_array_elements(ingredients)
  loop
    ing_id := btrim(ing->>'id');
    ing_name := btrim(ing->>'name');
    ing_amount := btrim(ing->>'amount');
    if ing_id !~* '^[a-z0-9][a-z0-9-]{0,79}$' then
      raise exception 'bad ingredient';
    end if;
    if ing_name is null or char_length(ing_name) < 1 or char_length(ing_name) > 200 then
      raise exception 'bad ingredient';
    end if;
    if ing_amount is null or char_length(ing_amount) < 1 or char_length(ing_amount) > 40 then
      raise exception 'bad ingredient';
    end if;
    if ing_id = any (seen_ids) then
      raise exception 'duplicate ingredient';
    end if;
    seen_ids := seen_ids || ing_id;
  end loop;

  perform public.ensure_dinner_week(week);

  if exists (
    select 1
    from public.dinner_days
    where week_id = week
      and id <> day_id
      and meal_id = new_id
  ) then
    raise exception 'duplicate meal id';
  end if;

  select day.meal_id
  into old_meal
  from public.dinner_days as day
  where day.week_id = week
    and day.id = day_id;

  update public.dinner_days
  set
    meal_id = new_id,
    meal_title = new_title,
    meal_minutes = new_minutes,
    updated_at = now()
  where week_id = week
    and id = day_id;

  delete from public.dinner_ingredients
  where week_id = week
    and meal_id = new_id;

  for ing in select value from jsonb_array_elements(ingredients)
  loop
    insert into public.dinner_ingredients (week_id, meal_id, id, name, amount, sort_order)
    values (week, new_id, btrim(ing->>'id'), btrim(ing->>'name'), btrim(ing->>'amount'), ord);
    ord := ord + 1;
  end loop;

  if old_meal is not null and old_meal <> new_id then
    delete from public.dinner_ingredients
    where week_id = week
      and meal_id = old_meal;
  end if;

  perform public.refresh_menu_shopping(week);
end;
$$;

alter table public.todos enable row level security;
alter table public.dinner_week enable row level security;
alter table public.dinner_days enable row level security;
alter table public.dinner_ingredients enable row level security;
alter table public.shopping_aisles enable row level security;
alter table public.shopping_items enable row level security;

revoke all on table public.todos from anon, authenticated;
revoke all on table public.dinner_week from anon, authenticated;
revoke all on table public.dinner_days from anon, authenticated;
revoke all on table public.dinner_ingredients from anon, authenticated;
revoke all on table public.shopping_aisles from anon, authenticated;
revoke all on table public.shopping_items from anon, authenticated;

grant select, insert, update, delete on table public.todos to service_role;
grant select, insert, update, delete on table public.dinner_week to service_role;
grant select, insert, update, delete on table public.dinner_days to service_role;
grant select, insert, update, delete on table public.dinner_ingredients to service_role;
grant select, insert, update, delete on table public.shopping_aisles to service_role;
grant select, insert, update, delete on table public.shopping_items to service_role;

revoke all on function public.ensure_dinner_week(text) from public, anon, authenticated;
revoke all on function public.refresh_menu_shopping(text) from public, anon, authenticated;
revoke all on function public.save_dinner_days(text, jsonb) from public, anon, authenticated;
revoke all on function public.save_dinner_day(text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.ensure_dinner_week(text) to service_role;
grant execute on function public.refresh_menu_shopping(text) to service_role;
grant execute on function public.save_dinner_days(text, jsonb) to service_role;
grant execute on function public.save_dinner_day(text, text, jsonb, jsonb) to service_role;

commit;
