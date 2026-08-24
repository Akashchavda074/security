-- Storage, auth bootstrap, push subscriptions, and broader tenant RLS

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('security-evidence', 'security-evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.current_profile()
returns profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

create or replace function public.same_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (p.role = 'super_admin' or p.company_id = target_company_id)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, company_id, phone, is_active)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::role_type, 'guard'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'company_id', '')::uuid,
    new.raw_user_meta_data->>'phone',
    true
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, profiles.phone),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "users manage own push subscriptions" on push_subscriptions
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Broader tenant policies for remaining tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'guards','shifts','guard_verifications','checkpoints','checkpoint_scans',
    'vehicles','vehicle_authorizations','vehicle_watchlist','vehicle_entries','vehicle_exits',
    'incidents','incident_evidence','cameras','notifications','alerts','devices','sessions','company_settings'
  ]
  loop
    execute format('drop policy if exists "tenant_select_%s" on %I', tbl, tbl);
    execute format(
      'create policy "tenant_select_%s" on %I for select using (public.same_company(company_id) or public.is_super_admin())',
      tbl, tbl
    );

    execute format('drop policy if exists "tenant_write_%s" on %I', tbl, tbl);
    execute format(
      'create policy "tenant_write_%s" on %I for all using (
         public.is_super_admin() or exists (
           select 1 from profiles p
           where p.id = auth.uid()
             and p.company_id = %I.company_id
             and p.role in (''company_admin'', ''super_admin'', ''guard'')
         )
       ) with check (
         public.is_super_admin() or exists (
           select 1 from profiles p
           where p.id = auth.uid()
             and p.company_id = %I.company_id
             and p.role in (''company_admin'', ''super_admin'', ''guard'')
         )
       )',
      tbl, tbl, tbl, tbl
    );
  end loop;
end $$;

create policy "storage evidence read" on storage.objects
for select using (
  bucket_id = 'security-evidence'
  and (
    public.is_super_admin()
    or public.same_company((storage.foldername(name))[1]::uuid)
  )
);

create policy "storage evidence write" on storage.objects
for insert with check (
  bucket_id = 'security-evidence'
  and (
    public.is_super_admin()
    or public.same_company((storage.foldername(name))[1]::uuid)
  )
);

create policy "storage evidence update" on storage.objects
for update using (
  bucket_id = 'security-evidence'
  and (
    public.is_super_admin()
    or public.same_company((storage.foldername(name))[1]::uuid)
  )
);
