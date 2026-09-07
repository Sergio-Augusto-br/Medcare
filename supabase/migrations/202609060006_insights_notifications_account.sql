create or replace function public.get_adherence_metrics(
  p_patient_id uuid,
  p_range_start date,
  p_range_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.has_patient_permission(p_patient_id, 'adherence')
    and not public.has_patient_permission(p_patient_id, 'history')
    and not public.has_patient_permission(p_patient_id, 'manage') then
    raise exception 'Você não tem permissão para consultar estes indicadores.' using errcode = '42501';
  end if;
  if p_range_end < p_range_start or p_range_end > p_range_start + 365 then
    raise exception 'Informe um período válido de até 366 dias.' using errcode = '22023';
  end if;

  with selected as (
    select * from public.dose_occurrences
    where patient_id = p_patient_id and local_date between p_range_start and p_range_end
  ), totals as (
    select count(*)::integer as scheduled,
           count(*) filter (where status = 'taken')::integer as taken,
           count(*) filter (where status = 'not_taken')::integer as not_taken,
           count(*) filter (where status = 'pending')::integer as pending
    from selected
  ), periods as (
    select period,
           count(*)::integer as total,
           count(*) filter (where status = 'taken')::integer as taken
    from (
      select status,
             case
               when scheduled_time < time '12:00' then 'Manhã'
               when scheduled_time < time '18:00' then 'Tarde'
               else 'Noite'
             end as period
      from selected
    ) grouped
    group by period
  ), weeks as (
    select to_char(date_trunc('week', local_date::timestamp), 'YYYY-MM-DD') as week,
           count(*)::integer as total,
           count(*) filter (where status = 'taken')::integer as taken
    from selected
    group by date_trunc('week', local_date::timestamp)
    order by date_trunc('week', local_date::timestamp)
  )
  select jsonb_build_object(
    'scheduled', totals.scheduled,
    'taken', totals.taken,
    'notTaken', totals.not_taken,
    'pending', totals.pending,
    'percentage', case when totals.scheduled = 0 then null else round(totals.taken * 100.0 / totals.scheduled)::integer end,
    'byPeriod', coalesce((select jsonb_agg(jsonb_build_object(
      'label', period, 'total', total, 'taken', taken,
      'percentage', case when total = 0 then null else round(taken * 100.0 / total)::integer end
    ) order by case period when 'Manhã' then 1 when 'Tarde' then 2 else 3 end) from periods), '[]'::jsonb),
    'byWeek', coalesce((select jsonb_agg(jsonb_build_object(
      'label', week, 'total', total, 'taken', taken,
      'percentage', case when total = 0 then null else round(taken * 100.0 / total)::integer end
    ) order by week) from weeks), '[]'::jsonb)
  ) into result from totals;
  return result;
end;
$$;

create or replace function public.refresh_patient_notifications(p_patient_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer := 0;
  inserted_count integer := 0;
begin
  if auth.uid() is not null and not public.has_patient_permission(p_patient_id, 'manage') then
    raise exception 'Você não tem permissão para atualizar os avisos desta rotina.' using errcode = '42501';
  end if;

  update public.notifications notification
  set resolved_at = coalesce(notification.resolved_at, clock_timestamp())
  from public.dose_occurrences dose
  where notification.dose_id = dose.id
    and dose.patient_id = p_patient_id
    and dose.status <> 'pending'
    and notification.resolved_at is null;

  insert into public.notifications(
    recipient_id, patient_id, dose_id, kind, title, body, deduplication_key
  )
  select patient.owner_id,
         dose.patient_id,
         dose.id,
         'reminder',
         'Dose aguardando registro',
         dose.medication_snapshot ->> 'name' || ' · ' || left(dose.scheduled_time::text, 5),
         'reminder:' || dose.id::text
  from public.dose_occurrences dose
  join public.patients patient on patient.id = dose.patient_id
  join public.profiles profile on profile.id = patient.owner_id and profile.reminders
  where dose.patient_id = p_patient_id
    and dose.status = 'pending'
    and dose.scheduled_at <= clock_timestamp()
    and dose.scheduled_at > clock_timestamp() - interval '24 hours'
    and coalesce(dose.snoozed_until, dose.scheduled_at) <= clock_timestamp()
  on conflict (deduplication_key) do update set
    resolved_at = null,
    title = excluded.title,
    body = excluded.body,
    created_at = clock_timestamp();
  get diagnostics inserted_count = row_count;
  affected := affected + inserted_count;

  insert into public.notifications(
    recipient_id, patient_id, dose_id, kind, title, body, deduplication_key
  )
  select membership.user_id,
         dose.patient_id,
         dose.id,
         'alert',
         'Dose atrasada de ' || patient.name,
         dose.medication_snapshot ->> 'name' || ' · prevista para ' || left(dose.scheduled_time::text, 5),
         'alert:' || dose.id::text || ':' || membership.user_id::text
  from public.dose_occurrences dose
  join public.patients patient on patient.id = dose.patient_id
  join public.patient_memberships membership
    on membership.patient_id = dose.patient_id
    and membership.revoked_at is null
    and 'alerts' = any(membership.permissions)
  join public.profiles profile on profile.id = membership.user_id and profile.caregiver_alerts
  where dose.patient_id = p_patient_id
    and dose.status = 'pending'
    and dose.scheduled_at + make_interval(mins => profile.alert_delay_minutes) <= clock_timestamp()
    and dose.scheduled_at > clock_timestamp() - interval '24 hours'
  on conflict (deduplication_key) do update set
    resolved_at = null,
    title = excluded.title,
    body = excluded.body,
    created_at = clock_timestamp();
  get diagnostics inserted_count = row_count;
  return affected + inserted_count;
end;
$$;

create or replace function public.refresh_all_patient_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_record record;
  affected integer := 0;
begin
  for patient_record in select id from public.patients loop
    affected := affected + public.refresh_patient_notifications(patient_record.id);
  end loop;
  return affected;
end;
$$;

create or replace function public.snooze_dose_reminder(p_dose_id uuid, p_minutes integer default 10)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  dose_record public.dose_occurrences%rowtype;
  snooze_until timestamptz;
begin
  select * into dose_record from public.dose_occurrences where id = p_dose_id for update;
  if not found or (
    not public.has_patient_permission(dose_record.patient_id, 'record')
    and not public.has_patient_permission(dose_record.patient_id, 'manage')
  ) then
    raise exception 'Dose não encontrada ou sem permissão.' using errcode = '42501';
  end if;
  if dose_record.status <> 'pending' then
    raise exception 'A dose já possui um registro.' using errcode = '22023';
  end if;
  if p_minutes not between 5 and 120 then
    raise exception 'Escolha um adiamento entre 5 e 120 minutos.' using errcode = '22023';
  end if;
  snooze_until := clock_timestamp() + make_interval(mins => p_minutes);
  update public.dose_occurrences set snoozed_until = snooze_until where id = p_dose_id;
  update public.notifications
  set resolved_at = coalesce(resolved_at, clock_timestamp())
  where dose_id = p_dose_id and recipient_id = auth.uid() and resolved_at is null;
  return snooze_until;
end;
$$;

create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar para exportar os dados.' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'exportedAt', clock_timestamp(),
    'account', jsonb_build_object('id', auth.uid(), 'email', auth.jwt() ->> 'email'),
    'profile', (select to_jsonb(profile) from public.profiles profile where profile.id = auth.uid()),
    'patients', coalesce((select jsonb_agg(to_jsonb(patient)) from public.patients patient where patient.owner_id = auth.uid()), '[]'::jsonb),
    'memberships', coalesce((select jsonb_agg(to_jsonb(membership)) from public.patient_memberships membership where membership.user_id = auth.uid() or membership.patient_id in (select id from public.patients where owner_id = auth.uid())), '[]'::jsonb),
    'invitations', coalesce((select jsonb_agg(to_jsonb(invitation)) from public.invitations invitation where invitation.created_by = auth.uid() or invitation.invited_email = lower(coalesce(auth.jwt() ->> 'email', ''))), '[]'::jsonb),
    'medications', coalesce((select jsonb_agg(to_jsonb(medication)) from public.medications medication where medication.patient_id in (select id from public.patients where owner_id = auth.uid())), '[]'::jsonb),
    'schedules', coalesce((select jsonb_agg(to_jsonb(schedule)) from public.medication_schedules schedule where schedule.medication_id in (select medication.id from public.medications medication where medication.patient_id in (select id from public.patients where owner_id = auth.uid()))), '[]'::jsonb),
    'doses', coalesce((select jsonb_agg(to_jsonb(dose)) from public.dose_occurrences dose where dose.patient_id in (select id from public.patients where owner_id = auth.uid())), '[]'::jsonb),
    'doseEvents', coalesce((select jsonb_agg(to_jsonb(event)) from public.dose_events event where event.patient_id in (select id from public.patients where owner_id = auth.uid())), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(to_jsonb(notification)) from public.notifications notification where notification.recipient_id = auth.uid()), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  token_issued_at bigint := coalesce((auth.jwt() ->> 'iat')::bigint, 0);
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar para encerrar a conta.' using errcode = '42501';
  end if;
  if extract(epoch from clock_timestamp())::bigint - token_issued_at > 600 then
    raise exception 'Confirme sua senha novamente antes de encerrar a conta.' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
  return true;
end;
$$;

revoke all on function public.get_adherence_metrics(uuid, date, date) from public;
revoke all on function public.refresh_patient_notifications(uuid) from public;
revoke all on function public.refresh_all_patient_notifications() from public;
revoke all on function public.snooze_dose_reminder(uuid, integer) from public;
revoke all on function public.export_my_data() from public;
revoke all on function public.delete_my_account() from public;

grant execute on function public.get_adherence_metrics(uuid, date, date) to authenticated;
grant execute on function public.refresh_patient_notifications(uuid) to authenticated;
grant execute on function public.refresh_all_patient_notifications() to service_role;
grant execute on function public.snooze_dose_reminder(uuid, integer) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
