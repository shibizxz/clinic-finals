create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('client', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('pending', 'confirmed', 'rejected', 'cancelled', 'rescheduled');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('queued', 'sent', 'failed');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  timezone text not null default 'Asia/Calcutta',
  booking_horizon_days integer not null default 30 check (booking_horizon_days between 1 and 90),
  support_phone text,
  whatsapp_display_number text,
  notification_provider text not null default 'meta-cloud',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  phone text,
  role public.app_role not null default 'client',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  title text not null,
  specialty text not null,
  bio text not null,
  focus_areas text[] not null default '{}',
  languages text[] not null default '{}',
  years_experience integer not null default 0,
  duration_minutes integer not null check (duration_minutes between 10 and 60),
  room_label text not null,
  accent_color text not null default '#0f766e',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.doctor_schedule_rules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_duration_minutes integer not null check (slot_duration_minutes between 10 and 60),
  daily_token_limit integer not null check (daily_token_limit between 1 and 40),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (doctor_id, weekday)
);

create table if not exists public.doctor_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  date date not null,
  closed boolean not null default false,
  start_time time,
  end_time time,
  slot_duration_minutes integer check (slot_duration_minutes between 10 and 60),
  daily_token_limit integer check (daily_token_limit between 1 and 40),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (doctor_id, date)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  user_email text not null,
  phone text not null,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  requested_date date not null,
  requested_time time not null,
  requested_at timestamptz not null default timezone('utc', now()),
  reason text not null,
  notes text not null default '',
  admin_note text,
  status public.appointment_status not null default 'pending',
  token_number integer,
  linked_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists appointments_unique_confirmed_token
  on public.appointments (doctor_id, requested_date, token_number)
  where token_number is not null and status = 'confirmed';

create unique index if not exists appointments_unique_open_slot
  on public.appointments (doctor_id, requested_date, requested_time)
  where status in ('pending', 'confirmed');

create table if not exists public.appointment_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null,
  from_status public.appointment_status,
  to_status public.appointment_status not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  channel text not null default 'whatsapp',
  template text not null,
  status public.notification_status not null default 'queued',
  recipient text not null,
  provider text not null default 'meta-cloud',
  message text not null,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Clinic Client'),
    'client'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists set_clinic_settings_updated_at on public.clinic_settings;
create trigger set_clinic_settings_updated_at
  before update on public.clinic_settings
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_doctors_updated_at on public.doctors;
create trigger set_doctors_updated_at
  before update on public.doctors
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_schedule_rules_updated_at on public.doctor_schedule_rules;
create trigger set_schedule_rules_updated_at
  before update on public.doctor_schedule_rules
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_schedule_overrides_updated_at on public.doctor_schedule_overrides;
create trigger set_schedule_overrides_updated_at
  before update on public.doctor_schedule_overrides
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.set_updated_at();

alter table public.clinic_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_schedule_rules enable row level security;
alter table public.doctor_schedule_overrides enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_history enable row level security;
alter table public.notification_logs enable row level security;

drop policy if exists "public read clinic settings" on public.clinic_settings;
create policy "public read clinic settings"
  on public.clinic_settings
  for select using (true);

drop policy if exists "admins manage clinic settings" on public.clinic_settings;
create policy "admins manage clinic settings"
  on public.clinic_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles
  for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

drop policy if exists "public read doctors" on public.doctors;
create policy "public read doctors"
  on public.doctors
  for select using (true);

drop policy if exists "admins manage doctors" on public.doctors;
create policy "admins manage doctors"
  on public.doctors
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read rules" on public.doctor_schedule_rules;
create policy "public read rules"
  on public.doctor_schedule_rules
  for select using (true);

drop policy if exists "admins manage rules" on public.doctor_schedule_rules;
create policy "admins manage rules"
  on public.doctor_schedule_rules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read overrides" on public.doctor_schedule_overrides;
create policy "public read overrides"
  on public.doctor_schedule_overrides
  for select using (true);

drop policy if exists "admins manage overrides" on public.doctor_schedule_overrides;
create policy "admins manage overrides"
  on public.doctor_schedule_overrides
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients read own appointments" on public.appointments;
create policy "clients read own appointments"
  on public.appointments
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "clients create own appointments" on public.appointments;
drop policy if exists "admins insert appointments" on public.appointments;
create policy "admins insert appointments"
  on public.appointments
  for insert with check (public.is_admin());

drop policy if exists "clients update own appointments" on public.appointments;
drop policy if exists "admins update appointments" on public.appointments;
create policy "admins update appointments"
  on public.appointments
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "history access" on public.appointment_history;
create policy "history access"
  on public.appointment_history
  for select using (
    public.is_admin() or exists (
      select 1 from public.appointments
      where appointments.id = appointment_history.appointment_id
        and appointments.user_id = auth.uid()
    )
  );

drop policy if exists "admins write history" on public.appointment_history;
create policy "admins write history"
  on public.appointment_history
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notification access" on public.notification_logs;
create policy "notification access"
  on public.notification_logs
  for select using (
    public.is_admin() or exists (
      select 1 from public.appointments
      where appointments.id = notification_logs.appointment_id
        and appointments.user_id = auth.uid()
    )
  );

drop policy if exists "admins manage notifications" on public.notification_logs;
create policy "admins manage notifications"
  on public.notification_logs
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.validate_appointment_slot(
  p_doctor_id uuid,
  p_requested_date date,
  p_requested_time time,
  p_excluded_appointment_id uuid default null,
  p_enforce_horizon boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text := 'Asia/Calcutta';
  v_booking_horizon integer := 30;
  v_current_local timestamp without time zone;
  v_base_rule public.doctor_schedule_rules;
  v_override public.doctor_schedule_overrides;
  v_start_time time;
  v_end_time time;
  v_slot_duration integer;
  v_daily_token_limit integer;
  v_start_minutes integer;
  v_requested_minutes integer;
begin
  select coalesce(timezone, 'Asia/Calcutta'), coalesce(booking_horizon_days, 30)
  into v_timezone, v_booking_horizon
  from public.clinic_settings
  order by created_at asc
  limit 1;

  v_current_local := timezone(v_timezone, now());

  if (p_requested_date + p_requested_time) <= v_current_local then
    raise exception 'Selected time must be in the future';
  end if;

  if p_enforce_horizon and p_requested_date > v_current_local::date + v_booking_horizon then
    raise exception 'Selected date is outside the booking horizon';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(p_doctor_id::text),
    (p_requested_date - date '2000-01-01')
  );

  select *
  into v_base_rule
  from public.doctor_schedule_rules
  where doctor_id = p_doctor_id
    and weekday = extract(dow from p_requested_date)::integer;

  if not found then
    raise exception 'That doctor is unavailable on the selected day';
  end if;

  select *
  into v_override
  from public.doctor_schedule_overrides
  where doctor_id = p_doctor_id
    and date = p_requested_date;

  if coalesce(v_override.closed, false) then
    raise exception 'That doctor is unavailable on the selected day';
  end if;

  v_start_time := coalesce(v_override.start_time, v_base_rule.start_time);
  v_end_time := coalesce(v_override.end_time, v_base_rule.end_time);
  v_slot_duration := coalesce(v_override.slot_duration_minutes, v_base_rule.slot_duration_minutes);
  v_daily_token_limit := coalesce(v_override.daily_token_limit, v_base_rule.daily_token_limit);

  if v_end_time <= v_start_time then
    raise exception 'Doctor schedule is invalid for the selected day';
  end if;

  if p_requested_time < v_start_time
    or (p_requested_time + make_interval(mins => v_slot_duration)) > v_end_time then
    raise exception 'Requested time is outside the doctor schedule';
  end if;

  v_start_minutes := extract(hour from v_start_time)::integer * 60
    + extract(minute from v_start_time)::integer;
  v_requested_minutes := extract(hour from p_requested_time)::integer * 60
    + extract(minute from p_requested_time)::integer;

  if mod(v_requested_minutes - v_start_minutes, v_slot_duration) <> 0 then
    raise exception 'Requested time is not aligned with the slot interval';
  end if;

  if exists (
    select 1
    from public.appointments
    where doctor_id = p_doctor_id
      and requested_date = p_requested_date
      and requested_time = p_requested_time
      and status in ('pending', 'confirmed')
      and (p_excluded_appointment_id is null or id <> p_excluded_appointment_id)
  ) then
    raise exception 'That slot is no longer available';
  end if;

  if (
    select count(*)
    from public.appointments
    where doctor_id = p_doctor_id
      and requested_date = p_requested_date
      and status in ('pending', 'confirmed')
      and (p_excluded_appointment_id is null or id <> p_excluded_appointment_id)
  ) >= v_daily_token_limit then
    raise exception 'The selected day has reached its token limit';
  end if;
end;
$$;

create or replace function public.create_appointment_request(
  p_doctor_id uuid,
  p_requested_date date,
  p_requested_time time,
  p_reason text,
  p_notes text default '',
  p_phone text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_appointment public.appointments;
  v_phone text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  v_phone := nullif(btrim(coalesce(p_phone, v_profile.phone, '')), '');

  if v_phone is null or length(regexp_replace(v_phone, '\D', '', 'g')) < 10 then
    raise exception 'A valid phone number is required';
  end if;

  perform public.validate_appointment_slot(
    p_doctor_id,
    p_requested_date,
    p_requested_time,
    null,
    true
  );

  insert into public.appointments (
    user_id,
    user_name,
    user_email,
    phone,
    doctor_id,
    requested_date,
    requested_time,
    reason,
    notes,
    status
  )
  values (
    auth.uid(),
    v_profile.display_name,
    v_profile.email,
    v_phone,
    p_doctor_id,
    p_requested_date,
    p_requested_time,
    p_reason,
    coalesce(p_notes, ''),
    'pending'
  )
  returning * into v_appointment;

  insert into public.appointment_history (
    appointment_id,
    actor_id,
    actor_role,
    from_status,
    to_status,
    note
  )
  values (
    v_appointment.id,
    auth.uid(),
    'client',
    null,
    'pending',
    'Client submitted a new appointment request.'
  );

  insert into public.notification_logs (
    appointment_id,
    template,
    status,
    recipient,
    provider,
    message
  )
  values (
    v_appointment.id,
    'request_received',
    'queued',
    v_appointment.phone,
    'meta-cloud',
    format(
      'Your consultation request for %s %s is pending approval.',
      v_appointment.requested_date,
      v_appointment.requested_time
    )
  );

  return v_appointment;
end;
$$;

create or replace function public.cancel_appointment_request(
  p_appointment_id uuid,
  p_note text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text := 'Asia/Calcutta';
  v_appointment public.appointments;
  v_actor_role text;
  v_previous_status public.appointment_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_appointment
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if not public.is_admin() and v_appointment.user_id <> auth.uid() then
    raise exception 'You cannot cancel this appointment';
  end if;

  if v_appointment.status not in ('pending', 'confirmed') then
    raise exception 'This appointment can no longer be cancelled';
  end if;

  select coalesce(timezone, 'Asia/Calcutta')
  into v_timezone
  from public.clinic_settings
  order by created_at asc
  limit 1;

  if (v_appointment.requested_date + v_appointment.requested_time)
    <= timezone(v_timezone, now())::timestamp without time zone then
    raise exception 'Past appointments cannot be cancelled online';
  end if;

  v_actor_role := case when public.is_admin() then 'admin' else 'client' end;
  v_previous_status := v_appointment.status;

  update public.appointments
  set status = 'cancelled',
      admin_note = coalesce(p_note, admin_note, 'Cancelled by client.')
  where id = p_appointment_id
  returning * into v_appointment;

  insert into public.appointment_history (
    appointment_id,
    actor_id,
    actor_role,
    from_status,
    to_status,
    note
  )
  values (
    v_appointment.id,
    auth.uid(),
    v_actor_role,
    v_previous_status,
    'cancelled',
    coalesce(p_note, 'Client cancelled the appointment.')
  );

  insert into public.notification_logs (
    appointment_id,
    template,
    status,
    recipient,
    provider,
    message
  )
  values (
    v_appointment.id,
    'booking_cancelled',
    'queued',
    v_appointment.phone,
    'meta-cloud',
    format(
      'Your consultation for %s %s has been cancelled.',
      v_appointment.requested_date,
      v_appointment.requested_time
    )
  );

  return v_appointment;
end;
$$;

create or replace function public.request_appointment_reschedule(
  p_appointment_id uuid,
  p_requested_date date,
  p_requested_time time,
  p_reason text,
  p_notes text default ''
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original public.appointments;
  v_appointment public.appointments;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_original
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'Original appointment not found';
  end if;

  if not public.is_admin() and v_original.user_id <> auth.uid() then
    raise exception 'You cannot reschedule this appointment';
  end if;

  if v_original.status not in ('pending', 'confirmed') then
    raise exception 'Only active bookings can be rescheduled';
  end if;

  perform public.validate_appointment_slot(
    v_original.doctor_id,
    p_requested_date,
    p_requested_time,
    null,
    true
  );

  insert into public.appointments (
    user_id,
    user_name,
    user_email,
    phone,
    doctor_id,
    requested_date,
    requested_time,
    reason,
    notes,
    admin_note,
    status,
    linked_appointment_id
  )
  values (
    v_original.user_id,
    v_original.user_name,
    v_original.user_email,
    v_original.phone,
    v_original.doctor_id,
    p_requested_date,
    p_requested_time,
    p_reason,
    coalesce(p_notes, ''),
    'Reschedule request pending admin approval.',
    'pending',
    v_original.id
  )
  returning * into v_appointment;

  insert into public.appointment_history (
    appointment_id,
    actor_id,
    actor_role,
    from_status,
    to_status,
    note
  )
  values (
    v_appointment.id,
    auth.uid(),
    'client',
    null,
    'pending',
    'Client submitted a reschedule request.'
  );

  insert into public.notification_logs (
    appointment_id,
    template,
    status,
    recipient,
    provider,
    message
  )
  values (
    v_appointment.id,
    'request_received',
    'queued',
    v_appointment.phone,
    'meta-cloud',
    format(
      'Your reschedule request for %s %s is pending approval.',
      v_appointment.requested_date,
      v_appointment.requested_time
    )
  );

  return v_appointment;
end;
$$;

create or replace function public.reject_appointment_request(
  p_appointment_id uuid,
  p_admin_note text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments;
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject appointments';
  end if;

  select *
  into v_appointment
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if v_appointment.status <> 'pending' then
    raise exception 'Only pending appointments can be rejected';
  end if;

  update public.appointments
  set status = 'rejected',
      token_number = null,
      admin_note = coalesce(p_admin_note, 'Rejected by admin')
  where id = p_appointment_id
  returning * into v_appointment;

  insert into public.appointment_history (
    appointment_id,
    actor_id,
    actor_role,
    from_status,
    to_status,
    note
  )
  values (
    v_appointment.id,
    auth.uid(),
    'admin',
    'pending',
    'rejected',
    coalesce(p_admin_note, 'Rejected by admin')
  );

  insert into public.notification_logs (
    appointment_id,
    template,
    status,
    recipient,
    provider,
    message
  )
  values (
    v_appointment.id,
    'booking_rejected',
    'queued',
    v_appointment.phone,
    'meta-cloud',
    format(
      'Your booking request for %s %s was rejected.',
      v_appointment.requested_date,
      v_appointment.requested_time
    )
  );

  return v_appointment;
end;
$$;

create or replace function public.approve_appointment_request(
  p_appointment_id uuid,
  p_admin_note text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments;
  v_next_token integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve appointments';
  end if;

  select *
  into v_appointment
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if v_appointment.status <> 'pending' then
    raise exception 'Only pending appointments can be approved';
  end if;

  perform public.validate_appointment_slot(
    v_appointment.doctor_id,
    v_appointment.requested_date,
    v_appointment.requested_time,
    v_appointment.id,
    false
  );

  select coalesce(max(token_number), 0) + 1
  into v_next_token
  from public.appointments
  where doctor_id = v_appointment.doctor_id
    and requested_date = v_appointment.requested_date
    and status = 'confirmed';

  update public.appointments
  set status = 'confirmed',
      token_number = v_next_token,
      admin_note = coalesce(p_admin_note, 'Approved by admin')
  where id = p_appointment_id
  returning * into v_appointment;

  if v_appointment.linked_appointment_id is not null then
    update public.appointments
    set status = 'rescheduled'
    where id = v_appointment.linked_appointment_id
      and status = 'confirmed';

    insert into public.appointment_history (
      appointment_id,
      actor_id,
      actor_role,
      from_status,
      to_status,
      note
    )
    values (
      v_appointment.linked_appointment_id,
      auth.uid(),
      'admin',
      'confirmed',
      'rescheduled',
      format('Superseded by approved reschedule %s.', v_appointment.id)
    );
  end if;

  insert into public.appointment_history (
    appointment_id,
    actor_id,
    actor_role,
    from_status,
    to_status,
    note
  )
  values (
    v_appointment.id,
    auth.uid(),
    'admin',
    'pending',
    'confirmed',
    coalesce(p_admin_note, 'Approved by admin')
  );

  insert into public.notification_logs (
    appointment_id,
    template,
    status,
    recipient,
    provider,
    message
  )
  values (
    v_appointment.id,
    case
      when v_appointment.linked_appointment_id is not null then 'reschedule_approved'
      else 'booking_confirmed'
    end,
    'queued',
    v_appointment.phone,
    'meta-cloud',
    format(
      'Your booking is confirmed. Token %s at %s %s.',
      v_appointment.token_number,
      v_appointment.requested_date,
      v_appointment.requested_time
    )
  );

  return v_appointment;
end;
$$;

insert into public.clinic_settings (
  id,
  name,
  address,
  timezone,
  booking_horizon_days,
  support_phone,
  whatsapp_display_number,
  notification_provider
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Webappzz Clinic',
  '14 Park View Road, Chennai',
  'Asia/Calcutta',
  30,
  '+91 90000 80000',
  '+91 90000 80000',
  'meta-cloud'
)
on conflict (id) do update
set name = excluded.name,
    address = excluded.address,
    timezone = excluded.timezone,
    booking_horizon_days = excluded.booking_horizon_days,
    support_phone = excluded.support_phone,
    whatsapp_display_number = excluded.whatsapp_display_number,
    notification_provider = excluded.notification_provider;
