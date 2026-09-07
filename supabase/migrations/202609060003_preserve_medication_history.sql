alter table public.medications
  drop constraint medications_created_by_fkey,
  alter column created_by drop not null,
  add constraint medications_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table public.medication_schedules
  drop constraint medication_schedules_created_by_fkey,
  alter column created_by drop not null,
  add constraint medication_schedules_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;
