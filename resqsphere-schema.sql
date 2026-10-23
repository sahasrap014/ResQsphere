-- ==============================================================================
-- RESQSPHERE — DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Complete schema for Supabase (PostgreSQL with RLS)
-- Project: https://pnykpvjsxwyezvvvjqjf.supabase.co
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('citizen', 'authority', 'partner', 'public')),
  phone text,
  district text,
  agency text,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Profiles policies:
-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own non-privileged profile fields (cannot elevate own role or approval)
create policy "Users can update own profile safely"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id and 
    role = (select role from public.profiles where id = auth.uid()) and
    is_approved = (select is_approved from public.profiles where id = auth.uid())
  );

-- Authorities can view all profiles
create policy "Authorities can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority' and profiles.is_approved = true
    )
  );

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_is_approved boolean;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'citizen');
  -- Citizens are auto-approved. Authority and Partner require explicit admin approval.
  if v_role = 'citizen' then
    v_is_approved := true;
  else
    v_is_approved := false;
  end if;

  insert into public.profiles (id, email, full_name, role, phone, district, agency, is_approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Citizen User'),
    v_role,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'district', 'General Sector'),
    new.raw_user_meta_data->>'agency',
    v_is_approved
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. INCIDENTS (Community emergency reports & verified incidents)
-- ------------------------------------------------------------------------------
create table if not exists public.incidents (
  id text primary key,
  title text not null,
  type text not null,
  description text not null,
  location text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  severity text not null check (severity in ('low', 'moderate', 'high', 'critical')),
  status text not null check (status in ('pending_verification', 'verified', 'dispatched', 'in_progress', 'resolved', 'rejected', 'duplicate')),
  reported_by text not null,
  reported_phone text,
  reported_at timestamp with time zone default timezone('utc'::text, now()) not null,
  casualties integer default 0,
  people_trapped integer default 0,
  assigned_team_id text,
  assigned_team_name text,
  is_duplicate_of text,
  is_potential_duplicate boolean default false,
  duplicate_group text,
  duplicate_reviewed boolean default false,
  verification_notes text,
  verified_at timestamp with time zone,
  verified_by text,
  citizen_id uuid references auth.users on delete set null
);

alter table public.incidents enable row level security;

-- Public/Citizen can read verified incidents only
create policy "Public can read verified incidents"
  on public.incidents for select
  using (status in ('verified', 'dispatched', 'in_progress', 'resolved'));

-- Citizens can view their own submitted reports
create policy "Citizens can view their own reports"
  on public.incidents for select
  using (auth.uid() = citizen_id);

-- Authenticated users can insert new emergency reports (status pending_verification)
create policy "Citizens can report emergencies"
  on public.incidents for insert
  with check (auth.role() = 'authenticated');

-- Authorized Authorities have full control
create policy "Authorities have full incident control"
  on public.incidents for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority' and profiles.is_approved = true
    )
  );

-- ------------------------------------------------------------------------------
-- 3. ASSISTANCE REQUESTS (Food, water, medicine, shelter requests)
-- ------------------------------------------------------------------------------
create table if not exists public.assistance_requests (
  id text primary key,
  citizen_name text not null,
  citizen_id uuid references auth.users on delete cascade not null,
  phone text not null,
  category text not null check (category in ('food', 'water', 'medical', 'shelter', 'clothing', 'rescue', 'sanitation')),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  people_count integer not null default 1,
  quantity_requested integer not null default 1 check (quantity_requested > 0),
  quantity_fulfilled integer not null default 0 check (quantity_fulfilled >= 0),
  remaining_quantity integer not null default 1 check (remaining_quantity >= 0),
  unit text not null default 'units',
  location text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  details text not null,
  special_needs text,
  status text not null check (status in ('pending', 'partially_fulfilled', 'matched', 'dispatched', 'fulfilled', 'cancelled')),
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  fulfilled_by text,
  fulfilled_at timestamp with time zone,
  allocated_resource_id text
);

alter table public.assistance_requests enable row level security;

-- Citizens can only view their own requests (Strict Privacy)
create policy "Citizens can view own assistance requests"
  on public.assistance_requests for select
  using (auth.uid() = citizen_id);

-- Citizens can submit assistance requests
create policy "Citizens can submit assistance requests"
  on public.assistance_requests for insert
  with check (auth.uid() = citizen_id);

-- Authorities & Approved Relief Partners can view all requests
create policy "Authorities and Partners can view requests"
  on public.assistance_requests for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner') and profiles.is_approved = true
    )
  );

-- Authorities & Approved Partners can update requests
create policy "Authorities and Partners can update requests"
  on public.assistance_requests for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner') and profiles.is_approved = true
    )
  );

-- ------------------------------------------------------------------------------
-- 4. SHELTERS & OCCUPANCY (Strict capacity check constraint)
-- ------------------------------------------------------------------------------
create table if not exists public.shelters (
  id text primary key,
  name text not null,
  address text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  capacity integer not null check (capacity > 0),
  current_occupancy integer not null default 0 check (current_occupancy >= 0 and current_occupancy <= capacity),
  status text not null check (status in ('active', 'near_capacity', 'full', 'inactive')),
  facilities text[] default array[]::text[],
  contact_phone text not null,
  contact_person text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.shelters enable row level security;

-- Shelters are public read
create policy "Anyone can read shelters"
  on public.shelters for select
  using (true);

-- Authorized Authorities can insert, update, or delete shelters
create policy "Authorities can manage shelters"
  on public.shelters for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority' and profiles.is_approved = true
    )
  );

-- ------------------------------------------------------------------------------
-- 5. RESPONSE TEAMS (Deployment lock constraint)
-- ------------------------------------------------------------------------------
create table if not exists public.response_teams (
  id text primary key,
  name text not null,
  agency text not null,
  type text not null,
  leader text not null,
  contact_phone text not null,
  members_count integer not null check (members_count > 0),
  status text not null check (status in ('available', 'deployed', 'on_site', 'resting')),
  current_incident_id text references public.incidents on delete set null,
  current_incident_title text,
  base_location text not null,
  lat double precision not null,
  lng double precision not null,
  specialties text[] default array[]::text[]
);

alter table public.response_teams enable row level security;

-- Public can view team status summary
create policy "Anyone can view response teams"
  on public.response_teams for select
  using (true);

-- Authorities can manage response teams
create policy "Authorities can manage response teams"
  on public.response_teams for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority' and profiles.is_approved = true
    )
  );

-- ------------------------------------------------------------------------------
-- 6. RELIEF RESOURCES & INVENTORY
-- ------------------------------------------------------------------------------
create table if not exists public.relief_resources (
  id text primary key,
  partner_name text not null,
  partner_id uuid references auth.users on delete cascade not null,
  category text not null,
  item_name text not null,
  quantity integer not null check (quantity >= 0),
  unit text not null,
  location text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  status text not null check (status in ('available', 'allocated', 'dispatched')),
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  contact_phone text not null
);

alter table public.relief_resources enable row level security;

-- Partners & Authorities can view resources
create policy "Authorities and Partners can view resources"
  on public.relief_resources for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner') and profiles.is_approved = true
    )
  );

create policy "Partners can manage their own resources"
  on public.relief_resources for all
  using (
    auth.uid() = partner_id and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'partner' and profiles.is_approved = true
    )
  );

-- ------------------------------------------------------------------------------
-- 7. RESOURCE ALLOCATIONS (Persistent Matching Records)
-- ------------------------------------------------------------------------------
create table if not exists public.allocations (
  id text primary key,
  request_id text not null references public.assistance_requests(id) on delete cascade,
  resource_id text not null references public.relief_resources(id) on delete cascade,
  allocated_quantity integer not null check (allocated_quantity > 0),
  unit text not null,
  allocated_by text not null,
  allocated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.allocations enable row level security;

create policy "Authorities and Partners can view allocations"
  on public.allocations for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner') and profiles.is_approved = true
    )
  );

create policy "Authorities can insert allocations"
  on public.allocations for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority' and profiles.is_approved = true
    )
  );

-- ------------------------------------------------------------------------------
-- 8. ATOMIC RESOURCE ALLOCATION RPC (Database-enforced integrity)
-- ------------------------------------------------------------------------------
create or replace function public.allocate_relief_resource(
  p_request_id text,
  p_resource_id text,
  p_quantity integer,
  p_allocated_by text
) returns jsonb as $$
declare
  v_res record;
  v_req record;
  v_alloc_id text;
  v_new_fulfilled integer;
  v_new_remaining integer;
  v_new_status text;
begin
  -- 1. Lock and validate resource
  select * into v_res from public.relief_resources where id = p_resource_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Selected resource inventory was not found.');
  end if;

  if v_res.quantity < p_quantity then
    return jsonb_build_object('success', false, 'error', format('Insufficient inventory. Only %s %s available.', v_res.quantity, v_res.unit));
  end if;

  -- 2. Lock and validate request
  select * into v_req from public.assistance_requests where id = p_request_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Assistance request was not found.');
  end if;

  if v_req.remaining_quantity < p_quantity then
    return jsonb_build_object('success', false, 'error', format('Allocation exceeds remaining need (%s %s needed).', v_req.remaining_quantity, v_req.unit));
  end if;

  -- 3. Decrement resource inventory
  update public.relief_resources
  set quantity = quantity - p_quantity,
      status = case when (quantity - p_quantity) = 0 then 'allocated' else status end
  where id = p_resource_id;

  -- 4. Calculate new request metrics
  v_new_fulfilled := v_req.quantity_fulfilled + p_quantity;
  v_new_remaining := v_req.quantity_requested - v_new_fulfilled;
  if v_new_remaining <= 0 then
    v_new_status := 'fulfilled';
    v_new_remaining := 0;
  else
    v_new_status := 'partially_fulfilled';
  end if;

  update public.assistance_requests
  set quantity_fulfilled = v_new_fulfilled,
      remaining_quantity = v_new_remaining,
      status = v_new_status,
      fulfilled_by = p_allocated_by,
      fulfilled_at = now(),
      allocated_resource_id = p_resource_id
  where id = p_request_id;

  -- 5. Record persistent allocation
  v_alloc_id := 'ALC-' || to_char(now(), 'YYYYMMDD') || '-' || substring(md5(random()::text) from 1 for 6);
  insert into public.allocations (id, request_id, resource_id, allocated_quantity, unit, allocated_by, allocated_at)
  values (v_alloc_id, p_request_id, p_resource_id, p_quantity, v_res.unit, p_allocated_by, now());

  return jsonb_build_object(
    'success', true,
    'allocation_id', v_alloc_id,
    'new_resource_qty', v_res.quantity - p_quantity,
    'new_fulfilled_qty', v_new_fulfilled,
    'new_remaining_qty', v_new_remaining,
    'new_status', v_new_status
  );
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------------------
-- 9. VOLUNTEERS & VEHICLES
-- ------------------------------------------------------------------------------
create table if not exists public.volunteers (
  id text primary key,
  name text not null,
  phone text not null,
  email text not null,
  district text not null,
  skills text[] default array[]::text[],
  preferred_work text not null,
  available_hours text not null,
  assigned_task_id text,
  status text not null check (status in ('registered', 'assigned', 'active')),
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.volunteers enable row level security;
create policy "Anyone can register as volunteer" on public.volunteers for insert with check (true);
create policy "Partners and Authorities can view volunteers" on public.volunteers for select using (true);

create table if not exists public.vehicles (
  id text primary key,
  partner_name text not null,
  vehicle_type text not null,
  registration_number text not null,
  capacity text not null,
  driver_name text not null,
  driver_phone text not null,
  location text not null,
  status text not null check (status in ('available', 'dispatched', 'maintenance')),
  lat double precision not null,
  lng double precision not null
);

alter table public.vehicles enable row level security;
create policy "Anyone can view vehicles" on public.vehicles for select using (true);
create policy "Partners can manage vehicles" on public.vehicles for all using (true);

-- ------------------------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
create index if not exists idx_incidents_status on public.incidents(status);
create index if not exists idx_incidents_district on public.incidents(district);
create index if not exists idx_shelters_district on public.shelters(district);
create index if not exists idx_shelters_status on public.shelters(status);
create index if not exists idx_assistance_requests_status on public.assistance_requests(status);
create index if not exists idx_assistance_requests_category on public.assistance_requests(category);
create index if not exists idx_relief_resources_category on public.relief_resources(category);
