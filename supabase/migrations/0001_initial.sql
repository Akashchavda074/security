create extension if not exists "pgcrypto";

create type company_status as enum ('active', 'suspended');
create type role_type as enum ('super_admin', 'company_admin', 'guard');
create type vehicle_status as enum ('authorized', 'expired', 'unknown', 'watchlist');
create type alert_severity as enum ('low', 'medium', 'high', 'critical');
create type shift_status as enum ('active', 'late', 'offline', 'missed_verification', 'ended');
create type entry_direction as enum ('entry', 'exit');

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  company_code text not null unique,
  name text not null,
  contact_email text,
  contact_phone text,
  address text,
  status company_status not null default 'active',
  admin_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  role role_type not null,
  full_name text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  device_fingerprint text not null,
  platform text,
  browser text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, device_fingerprint)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  device_id uuid references devices(id) on delete set null,
  ip inet,
  user_agent text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  revoked_at timestamptz
);

create table if not exists company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade unique,
  verification_interval_minutes integer not null default 60,
  verification_window_minutes integer not null default 15,
  retention_days integer not null default 365,
  allow_supervisor_creation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists gates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  code text not null,
  location text,
  status text not null default 'active',
  operating_hours text,
  security_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists guards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  employee_id text not null,
  mobile_number text,
  email text,
  assigned_gate_id uuid references gates(id) on delete set null,
  assigned_shift_id uuid,
  supervisor_id uuid references profiles(id) on delete set null,
  photo_url text,
  status text not null default 'active',
  joining_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_id)
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  guard_id uuid not null references guards(id) on delete cascade,
  gate_id uuid references gates(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status shift_status not null default 'active',
  late_at timestamptz,
  ended_at timestamptz,
  device_id uuid references devices(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists guard_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  guard_id uuid not null references guards(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  gate_id uuid references gates(id) on delete set null,
  device_id uuid references devices(id) on delete set null,
  verification_time timestamptz not null default now(),
  client_event_id uuid not null unique,
  image_url text,
  image_meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists checkpoints (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  gate_id uuid references gates(id) on delete set null,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists checkpoint_scans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  checkpoint_id uuid not null references checkpoints(id) on delete cascade,
  guard_id uuid not null references guards(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  scanned_at timestamptz not null default now(),
  client_event_id uuid not null unique,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text not null,
  owner_name text,
  driver_name text,
  department text,
  authorization_status vehicle_status not null default 'unknown',
  valid_from date,
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, vehicle_number)
);

create table if not exists vehicle_authorizations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  status vehicle_status not null default 'authorized',
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicle_watchlist (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  vehicle_number text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (company_id, vehicle_number)
);

create table if not exists vehicle_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  gate_id uuid not null references gates(id) on delete cascade,
  guard_id uuid not null references guards(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  client_event_id uuid not null unique,
  vehicle_number text not null,
  ocr_plate_number text,
  corrected_plate_number text,
  ocr_confidence numeric(5,2),
  correction_reason text,
  vehicle_image_url text,
  plate_image_url text,
  driver_name text,
  purpose text,
  destination text,
  remarks text,
  entry_time timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists vehicle_exits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  gate_id uuid not null references gates(id) on delete cascade,
  guard_id uuid not null references guards(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  vehicle_entry_id uuid not null references vehicle_entries(id) on delete cascade,
  client_event_id uuid not null unique,
  exit_image_url text,
  exit_time timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  gate_id uuid references gates(id) on delete set null,
  guard_id uuid references guards(id) on delete set null,
  severity alert_severity not null default 'low',
  title text not null,
  description text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists incident_evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists cameras (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  gate_id uuid references gates(id) on delete set null,
  name text not null,
  location text,
  status text not null default 'active',
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  severity alert_severity not null default 'low',
  title text not null,
  details text,
  related_table text,
  related_id uuid,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip inet,
  device_session_id uuid,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_company_id on profiles(company_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_guards_company_id on guards(company_id);
create index if not exists idx_gates_company_id on gates(company_id);
create index if not exists idx_shifts_company_id on shifts(company_id);
create index if not exists idx_shifts_guard_id on shifts(guard_id);
create index if not exists idx_guard_verifications_company_id on guard_verifications(company_id);
create index if not exists idx_checkpoint_scans_company_id on checkpoint_scans(company_id);
create index if not exists idx_vehicles_company_id on vehicles(company_id);
create index if not exists idx_vehicles_vehicle_number on vehicles(vehicle_number);
create index if not exists idx_vehicle_entries_company_id on vehicle_entries(company_id);
create index if not exists idx_vehicle_entries_entry_time on vehicle_entries(entry_time);
create index if not exists idx_vehicle_entries_gate_id on vehicle_entries(gate_id);
create index if not exists idx_vehicle_exits_company_id on vehicle_exits(company_id);
create index if not exists idx_incidents_company_id on incidents(company_id);
create index if not exists idx_incidents_status on incidents(status);
create index if not exists idx_alerts_company_id on alerts(company_id);
create index if not exists idx_audit_logs_company_id on audit_logs(company_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);

alter table companies enable row level security;
alter table profiles enable row level security;
alter table devices enable row level security;
alter table sessions enable row level security;
alter table company_settings enable row level security;
alter table system_settings enable row level security;
alter table gates enable row level security;
alter table guards enable row level security;
alter table shifts enable row level security;
alter table guard_verifications enable row level security;
alter table checkpoints enable row level security;
alter table checkpoint_scans enable row level security;
alter table vehicles enable row level security;
alter table vehicle_authorizations enable row level security;
alter table vehicle_watchlist enable row level security;
alter table vehicle_entries enable row level security;
alter table vehicle_exits enable row level security;
alter table incidents enable row level security;
alter table incident_evidence enable row level security;
alter table cameras enable row level security;
alter table notifications enable row level security;
alter table alerts enable row level security;
alter table audit_logs enable row level security;

create policy "company members can read their company" on companies
for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.company_id = companies.id
  )
);

create policy "super admins can manage companies" on companies
for all using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  )
) with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  )
);

create policy "company scoped profiles" on profiles
for all using (
  id = auth.uid() or exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.company_id = profiles.company_id
      and p.role in ('company_admin', 'super_admin')
  )
) with check (
  id = auth.uid() or exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.company_id = profiles.company_id
      and p.role in ('company_admin', 'super_admin')
  )
);

create policy "tenant select" on gates
for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.company_id = gates.company_id
  )
);

create policy "tenant write" on gates
for all using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.company_id = gates.company_id and p.role in ('company_admin', 'super_admin')
  )
) with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.company_id = gates.company_id and p.role in ('company_admin', 'super_admin')
  )
);

create policy "audit log read" on audit_logs
for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.company_id = audit_logs.company_id and p.role in ('company_admin', 'super_admin')
  )
);

create policy "audit append only" on audit_logs
for insert with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.company_id = audit_logs.company_id or p.role = 'super_admin')
  )
);

