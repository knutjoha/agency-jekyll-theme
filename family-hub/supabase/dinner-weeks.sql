-- Middag weeks. Run this once in the Supabase SQL editor.
-- Do not re-run schema.sql on a project that already has data.
--
-- service_role only, same as the other household functions.
-- anon and authenticated keep no grants.
-- Row level security stays on. This file adds no policies.
--
-- The dinner_week row id = 'current' is renamed to its starts_on date.
-- That row, its seven meals, and the existing shopping items stay.
-- Ingredients for those meals start empty.
-- If a dinner_week row with that Monday id already exists, this script
-- stops and writes nothing.

begin;

do $migrate$
declare
  current_start date;
  target_id text;
begin
  select starts_on
  into current_start
  from public.dinner_week
  where id = 'current'
  for update;

  if current_start is null then
    raise exception 'dinner week current was not found; stopped without writing';
  end if;

  target_id := current_start::text;

  if exists (select 1 from public.dinner_week where id = target_id) then
    raise exception 'dinner week % already exists; stopped without writing', target_id;
  end if;

  update public.dinner_week
  set id = target_id
  where id = 'current';

  alter table public.dinner_days drop constraint dinner_days_pkey;
  alter table public.dinner_days add column week_id text;
  update public.dinner_days set week_id = target_id;
  alter table public.dinner_days alter column week_id set not null;
  alter table public.dinner_days add constraint dinner_days_pkey primary key (week_id, id);
  alter table public.dinner_days
    add constraint dinner_days_week_id_fkey
    foreign key (week_id) references public.dinner_week (id);
  alter table public.dinner_days drop column meal_diets;
  alter table public.dinner_days
    add constraint dinner_days_week_meal unique (week_id, meal_id);

  alter table public.dinner_week
    add constraint dinner_week_starts_on_key unique (starts_on);

  create table public.dinner_ingredients (
    week_id text not null references public.dinner_week (id),
    meal_id text not null,
    id text not null,
    name text not null check (char_length(name) between 1 and 200),
    amount text not null check (char_length(amount) between 1 and 40),
    sort_order integer not null,
    primary key (week_id, meal_id, id)
  );

  alter table public.shopping_items add column week_id text;
  alter table public.shopping_items add column origin text;
  update public.shopping_items
  set week_id = target_id, origin = 'manual';
  alter table public.shopping_items alter column week_id set not null;
  alter table public.shopping_items alter column origin set not null;
  alter table public.shopping_items
    add constraint shopping_items_origin_check
    check (origin in ('manual', 'menu'));
  alter table public.shopping_items
    add constraint shopping_items_week_id_fkey
    foreign key (week_id) references public.dinner_week (id);
  create index shopping_items_week_aisle_sort
    on public.shopping_items (week_id, aisle_id, sort_order);

  insert into public.shopping_aisles (id, label, sort_order)
  values ('ukemeny', 'Fra ukemenyen', 4)
  on conflict (id) do nothing;
end
$migrate$;

drop function if exists public.save_dinner_days(jsonb);

-- The functions below match supabase/schema.sql.
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

-- Handleliste is manual. Dinner saves must not write shopping_items.
create or replace function public.refresh_menu_shopping(week text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if week is null then
    return;
  end if;
  return;
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
end;
$$;

alter table public.dinner_ingredients enable row level security;
revoke all on table public.dinner_ingredients from anon, authenticated;
grant select, insert, update, delete on table public.dinner_ingredients to service_role;

revoke all on function public.ensure_dinner_week(text) from public, anon, authenticated;
revoke all on function public.refresh_menu_shopping(text) from public, anon, authenticated;
revoke all on function public.save_dinner_days(text, jsonb) from public, anon, authenticated;
revoke all on function public.save_dinner_day(text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.ensure_dinner_week(text) to service_role;
grant execute on function public.refresh_menu_shopping(text) to service_role;
grant execute on function public.save_dinner_days(text, jsonb) to service_role;
grant execute on function public.save_dinner_day(text, text, jsonb, jsonb) to service_role;

commit;
