-- ==============================================================================
-- DISASTERSHIELD — DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Complete schema for Supabase (PostgreSQL with RLS)
-- Project: https://xlihhtmqfbaymzddzjqp.supabase.co
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

-- Users can update own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Authority can view all profiles
create policy "Authorities can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority' and profiles.is_approved = true
    )
  );

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
  status text not null check (status in ('pending_verification', 'verified', 'dispatched', 'in_progress', 'resolved', 'rejected')),
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
  verification_notes text,
  verified_at timestamp with time zone,
  verified_by text,
  citizen_id uuid references auth.users on delete set null
);

alter table public.incidents enable row level security;

-- Public/Citizen can read verified incidents
create policy "Public can read verified incidents"
  on public.incidents for select
  using (status in ('verified', 'dispatched', 'in_progress', 'resolved'));

-- Citizens can view their own submitted reports
create policy "Citizens can view their own reports"
  on public.incidents for select
  using (auth.uid() = citizen_id);

-- Citizens can insert new emergency reports (status defaults to pending_verification)
create policy "Citizens can report emergencies"
  on public.incidents for insert
  with check (auth.role() = 'authenticated');

-- Authorities can view, update, verify or assign all incidents
create policy "Authorities have full incident control"
  on public.incidents for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority'
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
  location text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  details text not null,
  special_needs text,
  status text not null check (status in ('pending', 'matched', 'dispatched', 'fulfilled', 'cancelled')),
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

-- Authorities & Relief Partners can view and fulfill pending requests
create policy "Authorities and Partners can view requests"
  on public.assistance_requests for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner')
    )
  );

create policy "Authorities and Partners can update requests"
  on public.assistance_requests for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner')
    )
  );

-- ------------------------------------------------------------------------------
-- 4. SHELTERS & OCCUPANCY
-- ------------------------------------------------------------------------------
create table if not exists public.shelters (
  id text primary key,
  name text not null,
  address text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  capacity integer not null,
  current_occupancy integer not null default 0,
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

-- Authorities can manage shelters
create policy "Authorities can update shelters"
  on public.shelters for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority'
    )
  );

-- ------------------------------------------------------------------------------
-- 5. RESPONSE TEAMS
-- ------------------------------------------------------------------------------
create table if not exists public.response_teams (
  id text primary key,
  name text not null,
  agency text not null,
  type text not null,
  leader text not null,
  contact_phone text not null,
  members_count integer not null,
  status text not null check (status in ('available', 'deployed', 'on_site', 'resting')),
  current_incident_id text references public.incidents on delete set null,
  current_incident_title text,
  base_location text not null,
  lat double precision not null,
  lng double precision not null,
  specialties text[] default array[]::text[]
);

alter table public.response_teams enable row level security;

-- Authorities can view and manage teams
create policy "Authorities can manage response teams"
  on public.response_teams for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority'
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
  quantity integer not null,
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

-- Partners can manage their own registered resources
create policy "Partners can manage their resources"
  on public.relief_resources for all
  using (auth.uid() = partner_id);

-- Authorities can view all resources
create policy "Authorities can view all resources"
  on public.relief_resources for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority'
    )
  );

-- ------------------------------------------------------------------------------
-- 7. VOLUNTEERS & VEHICLES
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
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade
);

alter table public.volunteers enable row level security;

create policy "Volunteers can view/edit own profile"
  on public.volunteers for all
  using (auth.uid() = user_id);

create policy "Authorities and Partners view volunteers"
  on public.volunteers for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner')
    )
  );

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
  lng double precision not null,
  registered_by uuid references auth.users on delete set null
);

alter table public.vehicles enable row level security;

create policy "Partners and Authorities manage vehicles"
  on public.vehicles for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('authority', 'partner')
    )
  );

-- ------------------------------------------------------------------------------
-- 8. PROPERTY DAMAGE REPORTS
-- ------------------------------------------------------------------------------
create table if not exists public.property_damage_reports (
  id text primary key,
  citizen_name text not null,
  citizen_id uuid references auth.users on delete cascade not null,
  phone text not null,
  property_type text not null,
  damage_severity text not null,
  location text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  estimated_loss_inr text not null,
  is_structural_hazard boolean default false,
  description text not null,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null check (status in ('pending_survey', 'surveyed', 'approved_compensation', 'rejected'))
);

alter table public.property_damage_reports enable row level security;

create policy "Citizens view own damage reports"
  on public.property_damage_reports for select
  using (auth.uid() = citizen_id);

create policy "Citizens submit damage reports"
  on public.property_damage_reports for insert
  with check (auth.uid() = citizen_id);

create policy "Authorities manage damage surveys"
  on public.property_damage_reports for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'authority'
    )
  );
