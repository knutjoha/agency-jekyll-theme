-- Family Hub Verdi: shared extras pool and complete-flag.
-- Run once if verdi.sql already ran without pool/done. Do not re-run schema.sql.
-- This file has no project URL and no API key.

begin;

alter table public.verdi_extras drop constraint if exists verdi_extras_person_id_check;
alter table public.verdi_extras
  add constraint verdi_extras_person_id_check
  check (person_id in ('amelia', 'hedda', 'maja', 'pool'));

alter table public.verdi_extras
  add column if not exists done boolean not null default false;

commit;
