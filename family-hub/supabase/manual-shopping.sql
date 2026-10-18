-- Family Hub: Handleliste is manual.
-- Run once in the Supabase SQL Editor after dinner-weeks.sql.
-- Do not re-run schema.sql. Do not change the dinner week tables.
-- This file has no project URL and no API key.
--
-- Dinner save / plan / cron still write meals. They no longer write shopping_items.
-- refresh_menu_shopping stays callable so leftover callers do nothing.

begin;

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

revoke all on function public.refresh_menu_shopping(text) from public, anon, authenticated;
revoke all on function public.save_dinner_days(text, jsonb) from public, anon, authenticated;
revoke all on function public.save_dinner_day(text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.refresh_menu_shopping(text) to service_role;
grant execute on function public.save_dinner_days(text, jsonb) to service_role;
grant execute on function public.save_dinner_day(text, text, jsonb, jsonb) to service_role;

-- Drop leftover auto-filled menu rows. Manual rows stay.
delete from public.shopping_items where origin = 'menu';

commit;
