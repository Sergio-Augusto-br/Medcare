create or replace function public.record_dose(
  p_dose_id uuid,
  p_status public.dose_status,
  p_taken_at timestamptz,
  p_reason text,
  p_expected_version integer,
  p_request_id uuid
)
returns public.dose_occurrences
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_dose public.dose_occurrences%rowtype;
  previous_event public.dose_events%rowtype;
  normalized_taken_at timestamptz;
  normalized_reason text := trim(coalesce(p_reason, ''));
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar para registrar uma dose.' using errcode = '42501';
  end if;

  select * into previous_event
  from public.dose_events
  where actor_id = auth.uid() and request_id = p_request_id;

  if found then
    select * into current_dose from public.dose_occurrences where id = previous_event.dose_id;
    return current_dose;
  end if;

  select * into current_dose
  from public.dose_occurrences
  where id = p_dose_id
  for update;

  if not found then
    raise exception 'Dose não encontrada.' using errcode = 'P0002';
  end if;
  if not public.has_patient_permission(current_dose.patient_id, 'record')
    and not public.has_patient_permission(current_dose.patient_id, 'manage') then
    raise exception 'Você não tem permissão para registrar esta dose.' using errcode = '42501';
  end if;
  if current_dose.version <> p_expected_version then
    raise exception 'Esta dose foi alterada em outro acesso. Recarregue e tente novamente.' using errcode = '40001';
  end if;
  if p_status not in ('pending', 'taken', 'not_taken') then
    raise exception 'Informe um estado válido para a dose.' using errcode = '22023';
  end if;
  if char_length(normalized_reason) > 500 then
    raise exception 'O motivo deve ter até 500 caracteres.' using errcode = '22023';
  end if;

  normalized_taken_at := case
    when p_status = 'taken' then coalesce(p_taken_at, clock_timestamp())
    else null
  end;
  if p_status = 'pending' then
    normalized_reason := '';
  end if;

  insert into public.dose_events(
    dose_id,
    patient_id,
    actor_id,
    previous_status,
    status,
    taken_at,
    reason,
    request_id
  ) values (
    current_dose.id,
    current_dose.patient_id,
    auth.uid(),
    current_dose.status,
    p_status,
    normalized_taken_at,
    normalized_reason,
    p_request_id
  );

  update public.dose_occurrences
  set status = p_status,
      taken_at = normalized_taken_at,
      reason = normalized_reason,
      recorded_by = auth.uid(),
      recorded_at = clock_timestamp(),
      version = version + 1
  where id = current_dose.id
  returning * into current_dose;

  update public.notifications
  set resolved_at = coalesce(resolved_at, clock_timestamp())
  where dose_id = current_dose.id and resolved_at is null;

  return current_dose;
end;
$$;

revoke all on function public.record_dose(
  uuid, public.dose_status, timestamptz, text, integer, uuid
) from public;
grant execute on function public.record_dose(
  uuid, public.dose_status, timestamptz, text, integer, uuid
) to authenticated;
