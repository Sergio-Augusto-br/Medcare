create or replace function public.list_accessible_patients()
returns table (
  id uuid,
  name text,
  timezone text,
  kind public.patient_kind,
  is_owner boolean,
  permissions text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
         p.name,
         p.timezone,
         p.kind,
         p.owner_id = auth.uid() as is_owner,
         case
           when p.owner_id = auth.uid() then array['medications','history','adherence','alerts','record','manage']::text[]
           else m.permissions
         end as permissions
  from public.patients p
  left join public.patient_memberships m
    on m.patient_id = p.id and m.user_id = auth.uid() and m.revoked_at is null
  where p.owner_id = auth.uid() or m.id is not null
  order by (p.owner_id = auth.uid()) desc, p.name;
$$;

create or replace function public.create_invitation(
  p_patient_id uuid,
  p_invited_email text,
  p_relation text,
  p_permissions text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_invited_email));
  normalized_relation text := trim(p_relation);
  invitation_id uuid;
  invited_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar para criar um convite.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.patients where id = p_patient_id and owner_id = auth.uid()
  ) then
    raise exception 'Somente o responsável pela rotina pode convidar pessoas.' using errcode = '42501';
  end if;
  if normalized_email = '' or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'Informe um e-mail válido.' using errcode = '22023';
  end if;
  if normalized_email = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'Use o compartilhamento para convidar outra conta.' using errcode = '22023';
  end if;
  if char_length(normalized_relation) not between 2 and 80 then
    raise exception 'Informe uma relação entre 2 e 80 caracteres.' using errcode = '22023';
  end if;
  if cardinality(p_permissions) = 0
    or not p_permissions <@ array['medications','history','adherence','alerts','record','manage']::text[] then
    raise exception 'Selecione ao menos uma permissão válida.' using errcode = '22023';
  end if;

  update public.invitations
  set status = 'expired', responded_at = clock_timestamp()
  where patient_id = p_patient_id
    and invited_email = normalized_email
    and status = 'pending'
    and expires_at <= clock_timestamp();

  insert into public.invitations(
    patient_id, invited_email, relation, permissions, created_by, expires_at
  ) values (
    p_patient_id,
    normalized_email,
    normalized_relation,
    p_permissions,
    auth.uid(),
    clock_timestamp() + interval '7 days'
  )
  on conflict (patient_id, invited_email) where status = 'pending'
  do update set
    relation = excluded.relation,
    permissions = excluded.permissions,
    created_by = excluded.created_by,
    expires_at = excluded.expires_at
  returning id into invitation_id;

  select id into invited_user_id from auth.users where lower(email) = normalized_email limit 1;
  if invited_user_id is not null then
    insert into public.notifications(
      recipient_id, patient_id, kind, title, body, deduplication_key
    ) values (
      invited_user_id,
      p_patient_id,
      'invite',
      'Novo convite de acompanhamento',
      'Você recebeu um convite para acompanhar uma rotina no MedCare.',
      'invite:' || invitation_id::text
    )
    on conflict (deduplication_key) do update set
      resolved_at = null,
      read_at = null,
      created_at = clock_timestamp();
  end if;

  return invitation_id;
end;
$$;

create or replace function public.respond_to_invitation(
  p_invitation_id uuid,
  p_accept boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_record public.invitations%rowtype;
  profile_name text;
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  membership_id uuid;
begin
  select * into invitation_record
  from public.invitations
  where id = p_invitation_id
  for update;

  if not found or invitation_record.invited_email <> current_email then
    raise exception 'Convite não encontrado para esta conta.' using errcode = '42501';
  end if;
  if invitation_record.status <> 'pending' then
    raise exception 'Este convite já foi respondido.' using errcode = '22023';
  end if;
  if invitation_record.expires_at <= clock_timestamp() then
    raise exception 'Este convite expirou.' using errcode = '22023';
  end if;

  if p_accept then
    select name into profile_name from public.profiles where id = auth.uid();
    insert into public.patient_memberships(
      patient_id, user_id, member_name, member_email, relation, permissions
    ) values (
      invitation_record.patient_id,
      auth.uid(),
      coalesce(profile_name, current_email),
      current_email,
      invitation_record.relation,
      invitation_record.permissions
    )
    on conflict (patient_id, user_id) do update set
      member_name = excluded.member_name,
      member_email = excluded.member_email,
      relation = excluded.relation,
      permissions = excluded.permissions,
      revoked_at = null
    returning id into membership_id;
  end if;

  update public.invitations
  set status = case
        when p_accept then 'accepted'::public.invitation_status
        else 'rejected'::public.invitation_status
      end,
      responded_at = clock_timestamp()
  where id = p_invitation_id;

  update public.notifications
  set resolved_at = coalesce(resolved_at, clock_timestamp()),
      read_at = coalesce(read_at, clock_timestamp())
  where recipient_id = auth.uid()
    and deduplication_key = 'invite:' || p_invitation_id::text;

  return membership_id;
end;
$$;

create or replace function public.update_membership_access(
  p_membership_id uuid,
  p_permissions text[],
  p_revoke boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_record public.patient_memberships%rowtype;
begin
  select * into membership_record
  from public.patient_memberships
  where id = p_membership_id
  for update;

  if not found or not exists (
    select 1 from public.patients
    where id = membership_record.patient_id and owner_id = auth.uid()
  ) then
    raise exception 'Vínculo não encontrado ou sem autorização.' using errcode = '42501';
  end if;
  if not p_revoke and (
    cardinality(p_permissions) = 0
    or not p_permissions <@ array['medications','history','adherence','alerts','record','manage']::text[]
  ) then
    raise exception 'Selecione ao menos uma permissão válida.' using errcode = '22023';
  end if;

  update public.patient_memberships
  set permissions = case when p_revoke then permissions else p_permissions end,
      revoked_at = case when p_revoke then clock_timestamp() else null end
  where id = p_membership_id;

  return p_membership_id;
end;
$$;

create or replace function public.cancel_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_record public.invitations%rowtype;
begin
  select * into invitation_record from public.invitations where id = p_invitation_id for update;
  if not found or not exists (
    select 1 from public.patients
    where id = invitation_record.patient_id and owner_id = auth.uid()
  ) then
    raise exception 'Convite não encontrado ou sem autorização.' using errcode = '42501';
  end if;
  if invitation_record.status <> 'pending' then
    raise exception 'Somente convites pendentes podem ser cancelados.' using errcode = '22023';
  end if;

  update public.invitations
  set status = 'cancelled', responded_at = clock_timestamp()
  where id = p_invitation_id;
  update public.notifications
  set resolved_at = coalesce(resolved_at, clock_timestamp())
  where deduplication_key = 'invite:' || p_invitation_id::text;
  return p_invitation_id;
end;
$$;

create or replace function public.list_dose_events(p_dose_id uuid)
returns table (
  id uuid,
  previous_status public.dose_status,
  status public.dose_status,
  taken_at timestamptz,
  reason text,
  actor_id uuid,
  actor_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_patient_id uuid;
begin
  select patient_id into target_patient_id
  from public.dose_occurrences
  where dose_occurrences.id = p_dose_id;

  if target_patient_id is null or (
    not public.has_patient_permission(target_patient_id, 'history')
    and not public.has_patient_permission(target_patient_id, 'record')
    and not public.has_patient_permission(target_patient_id, 'manage')
  ) then
    raise exception 'Dose não encontrada ou sem autorização.' using errcode = '42501';
  end if;

  return query
  select event.id,
         event.previous_status,
         event.status,
         event.taken_at,
         event.reason,
         event.actor_id,
         coalesce(profile.name, 'Conta removida') as actor_name,
         event.created_at
  from public.dose_events event
  left join public.profiles profile on profile.id = event.actor_id
  where event.dose_id = p_dose_id
  order by event.created_at desc;
end;
$$;

revoke all on function public.list_accessible_patients() from public;
revoke all on function public.create_invitation(uuid, text, text, text[]) from public;
revoke all on function public.respond_to_invitation(uuid, boolean) from public;
revoke all on function public.update_membership_access(uuid, text[], boolean) from public;
revoke all on function public.cancel_invitation(uuid) from public;
revoke all on function public.list_dose_events(uuid) from public;

grant execute on function public.list_accessible_patients() to authenticated;
grant execute on function public.create_invitation(uuid, text, text, text[]) to authenticated;
grant execute on function public.respond_to_invitation(uuid, boolean) to authenticated;
grant execute on function public.update_membership_access(uuid, text[], boolean) to authenticated;
grant execute on function public.cancel_invitation(uuid) to authenticated;
grant execute on function public.list_dose_events(uuid) to authenticated;
