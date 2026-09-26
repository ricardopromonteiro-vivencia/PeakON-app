-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: users (extends basic auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  role text default 'pt' check (role in ('pt', 'client')),
  linked_client_id uuid, -- For clients, links to their profile row
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: clients
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  birth_date date,
  photo_url text,
  goal text,
  status text default 'active' check (status in ('active', 'paused')),
  invite_code text unique, -- Código aleatório 6 dígitos
  is_registered boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ADD FK on users to clients (circular reference safely handled)
alter table public.users add constraint fk_linked_client foreign key (linked_client_id) references public.clients(id) on delete set null;

-- Table: workouts (Instance of a session)
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  notes text,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================== NEW V2 TABLES ===========================

-- Table: exercises (Global Catalog)
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  equipment text,
  created_by uuid references public.users(id), -- Null means global/system
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: workout_plans (Templates created by PT)
create table public.workout_plans (
  id uuid default uuid_generate_v4() primary key,
  pt_id uuid references public.users(id) not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: workout_plan_exercises (Exercises inside a Template)
create table public.workout_plan_exercises (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  sets integer default 3,
  reps text,
  rest_time text,
  notes text,
  sort_order integer default 0
);

-- Table: workout_exercises (Exercises actually performed inside a Session)
create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  sets_completed integer,
  reps_completed text,
  weight_used numeric(6,2),
  notes text,
  sort_order integer default 0
);
-- ====================================================================

-- Table: progress_logs
create table public.progress_logs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid not null references public.clients(id) on delete cascade,
  weight numeric(5,2),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: body_metrics
create table public.body_metrics (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid not null references public.clients(id) on delete cascade,
  chest numeric(5,2),
  waist numeric(5,2),
  arm numeric(5,2),
  leg numeric(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: photos
create table public.photos (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid not null references public.clients(id) on delete cascade,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)

-- Users table
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Clients table
alter table public.clients enable row level security;
create policy "Users can manage own clients" on public.clients for all using (auth.uid() = user_id);

-- Workouts table
alter table public.workouts enable row level security;
create policy "Users can manage own workouts" on public.workouts for all using (auth.uid() = user_id);
create policy "Clients can view own workouts" on public.workouts for select using (
  exists (select 1 from public.users where id = auth.uid() and linked_client_id = workouts.client_id)
);

-- Exercises table
alter table public.exercises enable row level security;
create policy "All authenticated users can see exercises" on public.exercises for select to authenticated using (true);
create policy "Users can insert exercises" on public.exercises for insert to authenticated with check (true);

-- Workout Plans (Templates)
alter table public.workout_plans enable row level security;
create policy "Users can manage own plans" on public.workout_plans for all using (pt_id = auth.uid());

-- Workout Plan Exercises
alter table public.workout_plan_exercises enable row level security;
create policy "Users can manage exercises for their plans" on public.workout_plan_exercises 
  for all using (
    exists (select 1 from public.workout_plans where id = workout_plan_exercises.plan_id and pt_id = auth.uid())
  );

-- Workout actual exercises logged
alter table public.workout_exercises enable row level security;
create policy "Users can manage items of their workouts" on public.workout_exercises 
  for all using (
    exists (select 1 from public.workouts where id = workout_exercises.workout_id and user_id = auth.uid())
  );
create policy "Clients can view their workout items" on public.workout_exercises for select using (
  exists (select 1 from public.workouts w join public.users u on w.client_id = u.linked_client_id where w.id = workout_exercises.workout_id and u.id = auth.uid())
);

-- Progress logs table
alter table public.progress_logs enable row level security;
create policy "Users can manage progress logs for their clients" on public.progress_logs 
  for all using (
    exists (select 1 from public.clients where id = progress_logs.client_id and user_id = auth.uid())
  );

-- Body metrics table
alter table public.body_metrics enable row level security;
create policy "Users can manage metrics for their clients" on public.body_metrics 
  for all using (
    exists (select 1 from public.clients where id = body_metrics.client_id and user_id = auth.uid())
  );

-- Photos table
alter table public.photos enable row level security;
create policy "Users can manage photos for their clients" on public.photos 
  for all using (
    exists (select 1 from public.clients where id = photos.client_id and user_id = auth.uid())
  );

-- Function to handle new user registration automatically via trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  cli_id uuid := null;
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'pt');
begin
  if v_role = 'client' then
     select id into cli_id from public.clients where invite_code = new.raw_user_meta_data->>'invite_code' limit 1;
  end if;
  
  insert into public.users (id, email, role, linked_client_id)
  values (new.id, new.email, v_role, cli_id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================
-- STORAGE SECURITY POLICIES (for the "Photos" bucket)
-- ====================================================
-- Note: You must run these in your Supabase SQL Editor if you created the bucket via Dashboard

-- Enable RLS on storage
alter table storage.objects enable row level security;

-- Allow public read access to the photos
create policy "Public photos are visible to everyone" 
  on storage.objects for select 
  using ( bucket_id = 'Photos' );

-- Allow authenticated PTs to upload new photos
create policy "Authenticated users can upload photos" 
  on storage.objects for insert 
  to authenticated 
  with check ( bucket_id = 'Photos' );

-- Allow authenticated PTs to update/delete their own photos (optional)
create policy "Authenticated users can update photos"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'Photos' );

create policy "Authenticated users can delete photos"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'Photos' );

