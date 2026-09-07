create extension if not exists pgcrypto with schema extensions;

create type public.patient_kind as enum ('self', 'assisted');
create type public.invitation_status as enum ('pending', 'accepted', 'rejected', 'expired', 'cancelled');
create type public.dose_status as enum ('pending', 'taken', 'not_taken');
create type public.notification_kind as enum ('reminder', 'alert', 'invite');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  timezone text not null default 'America/Manaus' check (char_length(timezone) between 3 and 80),
  text_size text not null default 'standard' check (text_size in ('standard', 'large', 'extra')),
  high_contrast boolean not null default false,
  reduced_motion boolean not null default false,
  state_labels boolean not null default true,
  reminders boolean not null default true,
  caregiver_alerts boolean not null default true,
  alert_delay_minutes integer not null default 20 check (alert_delay_minutes between 0 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  timezone text not null check (char_length(timezone) between 3 and 80),
  kind public.patient_kind not null default 'self',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index patients_one_self_profile_per_owner
  on public.patients(owner_id) where kind = 'self';

create table public.patient_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_name text not null,
  member_email text not null,
  relation text not null check (char_length(trim(relation)) between 2 and 80),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(patient_id, user_id),
  check (permissions <@ array['medications','history','adherence','alerts','record','manage']::text[])
);

create table public.invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  invited_email text not null,
  relation text not null check (char_length(trim(relation)) between 2 and 80),
  permissions text[] not null default '{}',
  status public.invitation_status not null default 'pending',
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  check (invited_email = lower(trim(invited_email))),
  check (permissions <@ array['medications','history','adherence','alerts','record','manage']::text[])
);

create unique index invitations_one_pending_per_patient_email
  on public.invitations(patient_id, invited_email) where status = 'pending';

create table public.medications (
  id uuid primary key default extensions.gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  strength text not null check (char_length(trim(strength)) between 1 and 40),
  unit text not null check (char_length(trim(unit)) between 1 and 30),
  form text not null check (char_length(trim(form)) between 1 and 50),
  quantity text not null check (char_length(trim(quantity)) between 1 and 60),
  instructions text not null default '' check (char_length(instructions) <= 500),
  version integer not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medication_schedules (
  id uuid primary key default extensions.gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  times time[] not null check (cardinality(times) between 1 and 24),
  weekdays smallint[] not null default array[0,1,2,3,4,5,6]::smallint[],
  start_date date not null,
  end_date date,
  timezone text not null check (char_length(timezone) between 3 and 80),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (weekdays <@ array[0,1,2,3,4,5,6]::smallint[]),
  check (valid_until is null or valid_until > valid_from)
);

create unique index medication_schedules_one_current
  on public.medication_schedules(medication_id) where valid_until is null;

create table public.dose_occurrences (
  id uuid primary key default extensions.gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null references public.medications(id),
  schedule_id uuid not null references public.medication_schedules(id),
  scheduled_at timestamptz not null,
  local_date date not null,
  scheduled_time time not null,
  timezone text not null,
  medication_snapshot jsonb not null,
  status public.dose_status not null default 'pending',
  taken_at timestamptz,
  reason text not null default '' check (char_length(reason) <= 500),
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz,
  snoozed_until timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  unique(medication_id, scheduled_at),
  check ((status = 'taken' and taken_at is not null) or status <> 'taken')
);

create index dose_occurrences_patient_date on public.dose_occurrences(patient_id, local_date, scheduled_at);

create table public.dose_events (
  id uuid primary key default extensions.gen_random_uuid(),
  dose_id uuid not null references public.dose_occurrences(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  previous_status public.dose_status not null,
  status public.dose_status not null,
  taken_at timestamptz,
  reason text not null default '',
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique(actor_id, request_id)
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete cascade,
  dose_id uuid references public.dose_occurrences(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  read_at timestamptz,
  resolved_at timestamptz,
  deduplication_key text unique,
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'onesignal',
  external_id text not null,
  device_label text not null default '',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(provider, external_id)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger patients_touch_updated_at before update on public.patients
for each row execute function public.touch_updated_at();
create trigger medications_touch_updated_at before update on public.medications
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  profile_name text;
  profile_timezone text;
begin
  profile_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1), 'Usuário');
  profile_timezone := coalesce(nullif(trim(new.raw_user_meta_data ->> 'timezone'), ''), 'America/Manaus');

  insert into public.profiles(id, name, timezone)
  values (new.id, profile_name, profile_timezone)
  on conflict (id) do nothing;

  insert into public.patients(owner_id, name, timezone, kind)
  values (new.id, profile_name, profile_timezone, 'self')
  on conflict (owner_id) where kind = 'self' do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles(id, name, timezone)
select id,
       coalesce(nullif(trim(raw_user_meta_data ->> 'name'), ''), split_part(email, '@', 1), 'Usuário'),
       coalesce(nullif(trim(raw_user_meta_data ->> 'timezone'), ''), 'America/Manaus')
from auth.users
on conflict (id) do nothing;

insert into public.patients(owner_id, name, timezone, kind)
select p.id, p.name, p.timezone, 'self'
from public.profiles p
where not exists (select 1 from public.patients existing where existing.owner_id = p.id and existing.kind = 'self');

create or replace function public.has_patient_permission(target_patient_id uuid, requested_permission text default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.patients p
    where p.id = target_patient_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.patient_memberships m
    where m.patient_id = target_patient_id
      and m.user_id = auth.uid()
      and m.revoked_at is null
      and (requested_permission is null or requested_permission = any(m.permissions))
  );
$$;

revoke all on function public.has_patient_permission(uuid, text) from public;
grant execute on function public.has_patient_permission(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.patient_memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.medications enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.dose_occurrences enable row level security;
alter table public.dose_events enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy patients_select_authorized on public.patients for select to authenticated
using (public.has_patient_permission(id, null));
create policy patients_insert_owned on public.patients for insert to authenticated with check (owner_id = auth.uid());
create policy patients_update_owned on public.patients for update to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy memberships_select_related on public.patient_memberships for select to authenticated
using (user_id = auth.uid() or public.has_patient_permission(patient_id, null));

create policy invitations_select_related on public.invitations for select to authenticated
using (
  created_by = auth.uid()
  or invited_email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy medications_select_authorized on public.medications for select to authenticated
using (public.has_patient_permission(patient_id, 'medications') or public.has_patient_permission(patient_id, 'manage'));

create policy schedules_select_authorized on public.medication_schedules for select to authenticated
using (exists (
  select 1 from public.medications m
  where m.id = medication_id
    and (public.has_patient_permission(m.patient_id, 'medications') or public.has_patient_permission(m.patient_id, 'manage'))
));

create policy doses_select_authorized on public.dose_occurrences for select to authenticated
using (
  public.has_patient_permission(patient_id, 'history')
  or public.has_patient_permission(patient_id, 'record')
  or public.has_patient_permission(patient_id, 'manage')
);

create policy dose_events_select_authorized on public.dose_events for select to authenticated
using (public.has_patient_permission(patient_id, 'history'));

create policy notifications_select_own on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy push_subscriptions_all_own on public.push_subscriptions for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.patients to authenticated;
grant select on public.patient_memberships, public.invitations, public.medications,
  public.medication_schedules, public.dose_occurrences, public.dose_events to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
