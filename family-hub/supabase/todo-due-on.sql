-- Family Hub todos: store the frist as a date.
-- Run once. Do not re-run schema.sql. This file has no project URL and no API key.

alter table public.todos
  add column if not exists due_on date;
