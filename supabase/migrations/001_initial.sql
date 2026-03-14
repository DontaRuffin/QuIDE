-- QuIDE — Initial Supabase Migration
-- Run in Supabase Dashboard > SQL Editor

-- Profiles table
create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  tier text not null default 'free',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Circuits table
create table circuits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null default 'Untitled Circuit',
  qasm text not null,
  num_qubits int default 3,
  gate_count int default 0,
  is_public bool default false,
  share_slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table circuits enable row level security;
create policy "Users can CRUD own circuits" on circuits for all using (auth.uid() = user_id);
create policy "Anyone can view public circuits" on circuits for select using (is_public = true);

-- Simulation results table
create table simulation_results (
  id uuid primary key default gen_random_uuid(),
  circuit_id uuid references circuits(id) on delete cascade,
  user_id uuid references profiles(id),
  backend text default 'aer_simulator',
  shots int default 1024,
  counts jsonb,
  statevector jsonb,
  runtime_ms int,
  created_at timestamptz default now()
);

alter table simulation_results enable row level security;
create policy "Users can view own results" on simulation_results for select using (auth.uid() = user_id);
create policy "Users can insert own results" on simulation_results for insert with check (auth.uid() = user_id);
