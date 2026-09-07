create or replace function public.generate_occurrences_for_schedule(
  target_schedule_id uuid,
  range_start date,
  range_end date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer := 0;
begin
  if range_end < range_start or range_end > range_start + 120 then
    raise exception 'O período de geração deve ter entre 1 e 121 dias.' using errcode = '22023';
  end if;

  insert into public.dose_occurrences(
    patient_id,
    medication_id,
    schedule_id,
    scheduled_at,
    local_date,
    scheduled_time,
    timezone,
    medication_snapshot
  )
  select
    medication.patient_id,
    medication.id,
    schedule.id,
    (calendar_day.day::date + scheduled_time.value)::timestamp at time zone schedule.timezone,
    calendar_day.day::date,
    scheduled_time.value,
    schedule.timezone,
    jsonb_build_object(
      'name', medication.name,
      'strength', medication.strength,
      'unit', medication.unit,
      'form', medication.form,
      'quantity', medication.quantity,
      'instructions', medication.instructions,
      'medication_version', medication.version,
      'schedule_version', schedule.version
    )
  from public.medication_schedules schedule
  join public.medications medication on medication.id = schedule.medication_id
  cross join lateral generate_series(
    greatest(range_start, schedule.start_date),
    least(range_end, coalesce(schedule.end_date, range_end)),
    interval '1 day'
  ) as calendar_day(day)
  cross join lateral unnest(schedule.times) as scheduled_time(value)
  where schedule.id = target_schedule_id
    and medication.archived_at is null
    and extract(dow from calendar_day.day)::smallint = any(schedule.weekdays)
    and (calendar_day.day::date + scheduled_time.value)::timestamp at time zone schedule.timezone >= now()
  on conflict (medication_id, scheduled_at) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.generate_occurrences_for_schedule(uuid, date, date) from public;

create or replace function public.create_medication_routine(
  p_patient_id uuid,
  p_name text,
  p_strength text,
  p_unit text,
  p_form text,
  p_quantity text,
  p_instructions text,
  p_times time[],
  p_weekdays smallint[],
  p_start_date date,
  p_end_date date,
  p_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  medication_id uuid;
  schedule_id uuid;
  normalized_times time[];
  normalized_weekdays smallint[];
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar para cadastrar um medicamento.' using errcode = '42501';
  end if;
  if not public.has_patient_permission(p_patient_id, 'manage') then
    raise exception 'Você não tem permissão para gerenciar esta rotina.' using errcode = '42501';
  end if;

  p_name := trim(p_name);
  p_strength := trim(p_strength);
  p_unit := trim(p_unit);
  p_form := trim(p_form);
  p_quantity := trim(p_quantity);
  p_instructions := trim(coalesce(p_instructions, ''));
  p_timezone := trim(p_timezone);

  if char_length(p_name) not between 1 and 160
    or char_length(p_strength) not between 1 and 40
    or char_length(p_unit) not between 1 and 30
    or char_length(p_form) not between 1 and 50
    or char_length(p_quantity) not between 1 and 60
    or char_length(p_instructions) > 500 then
    raise exception 'Revise os dados do medicamento.' using errcode = '22023';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Informe um fuso horário válido.' using errcode = '22023';
  end if;
  if p_start_date < (now() at time zone p_timezone)::date
    or (p_end_date is not null and p_end_date < p_start_date) then
    raise exception 'Informe um período válido para a rotina.' using errcode = '22023';
  end if;
  if cardinality(p_times) not between 1 and 24 then
    raise exception 'Informe de 1 a 24 horários.' using errcode = '22023';
  end if;
  if cardinality(p_weekdays) not between 1 and 7
    or not (p_weekdays <@ array[0,1,2,3,4,5,6]::smallint[]) then
    raise exception 'Selecione ao menos um dia da semana válido.' using errcode = '22023';
  end if;

  select array_agg(distinct value order by value)
  into normalized_times
  from unnest(p_times) as item(value);

  select array_agg(distinct value order by value)
  into normalized_weekdays
  from unnest(p_weekdays) as item(value);

  insert into public.medications(
    patient_id, name, strength, unit, form, quantity, instructions, created_by
  ) values (
    p_patient_id, p_name, p_strength, p_unit, p_form, p_quantity, p_instructions, auth.uid()
  ) returning id into medication_id;

  insert into public.medication_schedules(
    medication_id, times, weekdays, start_date, end_date, timezone, created_by
  ) values (
    medication_id, normalized_times, normalized_weekdays, p_start_date, p_end_date,
    p_timezone, auth.uid()
  ) returning id into schedule_id;

  perform public.generate_occurrences_for_schedule(
    schedule_id,
    p_start_date,
    least(coalesce(p_end_date, p_start_date + 90), p_start_date + 90)
  );

  return medication_id;
end;
$$;

create or replace function public.update_medication_routine(
  p_medication_id uuid,
  p_expected_version integer,
  p_name text,
  p_strength text,
  p_unit text,
  p_form text,
  p_quantity text,
  p_instructions text,
  p_times time[],
  p_weekdays smallint[],
  p_start_date date,
  p_end_date date,
  p_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_medication public.medications%rowtype;
  schedule_id uuid;
  next_schedule_version integer;
  normalized_times time[];
  normalized_weekdays smallint[];
  change_instant timestamptz := clock_timestamp();
begin
  select * into current_medication
  from public.medications
  where id = p_medication_id
  for update;

  if not found or current_medication.archived_at is not null then
    raise exception 'Medicamento não encontrado.' using errcode = 'P0002';
  end if;
  if not public.has_patient_permission(current_medication.patient_id, 'manage') then
    raise exception 'Você não tem permissão para gerenciar esta rotina.' using errcode = '42501';
  end if;
  if current_medication.version <> p_expected_version then
    raise exception 'Este medicamento foi alterado em outro acesso. Recarregue e tente novamente.' using errcode = '40001';
  end if;

  p_name := trim(p_name);
  p_strength := trim(p_strength);
  p_unit := trim(p_unit);
  p_form := trim(p_form);
  p_quantity := trim(p_quantity);
  p_instructions := trim(coalesce(p_instructions, ''));
  p_timezone := trim(p_timezone);

  if char_length(p_name) not between 1 and 160
    or char_length(p_strength) not between 1 and 40
    or char_length(p_unit) not between 1 and 30
    or char_length(p_form) not between 1 and 50
    or char_length(p_quantity) not between 1 and 60
    or char_length(p_instructions) > 500 then
    raise exception 'Revise os dados do medicamento.' using errcode = '22023';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Informe um fuso horário válido.' using errcode = '22023';
  end if;
  if p_start_date < (now() at time zone p_timezone)::date
    or (p_end_date is not null and p_end_date < p_start_date) then
    raise exception 'Informe um período válido para a rotina.' using errcode = '22023';
  end if;
  if cardinality(p_times) not between 1 and 24 then
    raise exception 'Informe de 1 a 24 horários.' using errcode = '22023';
  end if;
  if cardinality(p_weekdays) not between 1 and 7
    or not (p_weekdays <@ array[0,1,2,3,4,5,6]::smallint[]) then
    raise exception 'Selecione ao menos um dia da semana válido.' using errcode = '22023';
  end if;

  select array_agg(distinct value order by value)
  into normalized_times
  from unnest(p_times) as item(value);

  select array_agg(distinct value order by value)
  into normalized_weekdays
  from unnest(p_weekdays) as item(value);

  update public.medication_schedules
  set valid_until = change_instant
  where medication_id = p_medication_id and valid_until is null
  returning version + 1 into next_schedule_version;

  if not found then
    raise exception 'A programação atual não foi encontrada.' using errcode = 'P0002';
  end if;

  update public.medications
  set name = p_name,
      strength = p_strength,
      unit = p_unit,
      form = p_form,
      quantity = p_quantity,
      instructions = p_instructions,
      version = version + 1
  where id = p_medication_id;

  delete from public.dose_occurrences
  where medication_id = p_medication_id
    and status = 'pending'
    and scheduled_at >= change_instant
    and local_date >= p_start_date;

  insert into public.medication_schedules(
    medication_id, times, weekdays, start_date, end_date, timezone,
    valid_from, version, created_by
  ) values (
    p_medication_id, normalized_times, normalized_weekdays, p_start_date, p_end_date,
    p_timezone, change_instant, next_schedule_version, auth.uid()
  ) returning id into schedule_id;

  perform public.generate_occurrences_for_schedule(
    schedule_id,
    p_start_date,
    least(coalesce(p_end_date, p_start_date + 90), p_start_date + 90)
  );

  return p_medication_id;
end;
$$;

create or replace function public.archive_medication_routine(
  p_medication_id uuid,
  p_expected_version integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_medication public.medications%rowtype;
  change_instant timestamptz := clock_timestamp();
begin
  select * into current_medication
  from public.medications
  where id = p_medication_id
  for update;

  if not found or current_medication.archived_at is not null then
    raise exception 'Medicamento não encontrado.' using errcode = 'P0002';
  end if;
  if not public.has_patient_permission(current_medication.patient_id, 'manage') then
    raise exception 'Você não tem permissão para gerenciar esta rotina.' using errcode = '42501';
  end if;
  if current_medication.version <> p_expected_version then
    raise exception 'Este medicamento foi alterado em outro acesso. Recarregue e tente novamente.' using errcode = '40001';
  end if;

  update public.medications
  set archived_at = change_instant, version = version + 1
  where id = p_medication_id;

  update public.medication_schedules
  set valid_until = change_instant
  where medication_id = p_medication_id and valid_until is null;

  delete from public.dose_occurrences
  where medication_id = p_medication_id
    and status = 'pending'
    and scheduled_at >= change_instant;

  return p_medication_id;
end;
$$;

create or replace function public.refresh_dose_occurrences(
  p_patient_id uuid,
  p_range_start date,
  p_range_end date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  schedule_record record;
  total_inserted integer := 0;
  patient_timezone text;
begin
  if not public.has_patient_permission(p_patient_id, 'manage') then
    raise exception 'Você não tem permissão para atualizar esta rotina.' using errcode = '42501';
  end if;
  select timezone into patient_timezone from public.patients where id = p_patient_id;
  if p_range_start < (now() at time zone patient_timezone)::date
    or p_range_end < p_range_start
    or p_range_end > p_range_start + 120 then
    raise exception 'Informe um período futuro de até 121 dias.' using errcode = '22023';
  end if;

  for schedule_record in
    select schedule.id
    from public.medication_schedules schedule
    join public.medications medication on medication.id = schedule.medication_id
    where medication.patient_id = p_patient_id
      and medication.archived_at is null
      and schedule.valid_until is null
  loop
    total_inserted := total_inserted + public.generate_occurrences_for_schedule(
      schedule_record.id,
      p_range_start,
      p_range_end
    );
  end loop;

  return total_inserted;
end;
$$;

revoke all on function public.create_medication_routine(
  uuid, text, text, text, text, text, text, time[], smallint[], date, date, text
) from public;
revoke all on function public.update_medication_routine(
  uuid, integer, text, text, text, text, text, text, time[], smallint[], date, date, text
) from public;
revoke all on function public.archive_medication_routine(uuid, integer) from public;
revoke all on function public.refresh_dose_occurrences(uuid, date, date) from public;

grant execute on function public.create_medication_routine(
  uuid, text, text, text, text, text, text, time[], smallint[], date, date, text
) to authenticated;
grant execute on function public.update_medication_routine(
  uuid, integer, text, text, text, text, text, text, time[], smallint[], date, date, text
) to authenticated;
grant execute on function public.archive_medication_routine(uuid, integer) to authenticated;
grant execute on function public.refresh_dose_occurrences(uuid, date, date) to authenticated;
