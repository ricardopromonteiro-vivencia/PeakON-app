-- ============================================================
-- SISTEMA DE MARCAÇÕES — PeakON
-- Executar no Supabase SQL Editor
-- ============================================================

-- ----------------------------------------------------------
-- 1. DISPONIBILIDADE DO PT (slots de tempo)
-- ----------------------------------------------------------
create table public.pt_availability (
  id uuid default uuid_generate_v4() primary key,
  pt_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.pt_availability enable row level security;

-- PT gere a sua própria disponibilidade
create policy "PT manages own availability"
  on public.pt_availability for all
  using (pt_id = auth.uid());

-- Clientes vêem a disponibilidade do SEU PT
create policy "Clients view their PT availability"
  on public.pt_availability for select
  using (
    pt_id in (
      select c.user_id
      from public.clients c
      join public.users u on u.linked_client_id = c.id
      where u.id = auth.uid()
    )
  );

-- ----------------------------------------------------------
-- 2. CONFIGURAÇÃO DE SESSÃO POR CLIENTE (duração definida pelo PT)
-- ----------------------------------------------------------
create table public.client_session_config (
  id uuid default uuid_generate_v4() primary key,
  pt_id uuid references public.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  session_duration_minutes integer not null default 60,
  unique(pt_id, client_id)
);

-- RLS
alter table public.client_session_config enable row level security;

-- PT gere as configurações de todos os seus clientes
create policy "PT manages session configs"
  on public.client_session_config for all
  using (pt_id = auth.uid());

-- Cliente vê a sua própria configuração
create policy "Client views own session config"
  on public.client_session_config for select
  using (
    client_id in (
      select linked_client_id from public.users where id = auth.uid()
    )
  );

-- ----------------------------------------------------------
-- 3. RESERVAS (pedidos de sessão pelo cliente)
-- ----------------------------------------------------------
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  availability_id uuid references public.pt_availability(id) on delete cascade not null,
  pt_id uuid references public.users(id) not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.bookings enable row level security;

-- PT vê e gere todas as reservas dos seus clientes
create policy "PT manages own bookings"
  on public.bookings for all
  using (pt_id = auth.uid());

-- Cliente vê as suas próprias reservas
create policy "Client views own bookings"
  on public.bookings for select
  using (
    client_id in (
      select linked_client_id from public.users where id = auth.uid()
    )
  );

-- Cliente pode criar pedido de reserva (insert)
create policy "Client can request booking"
  on public.bookings for insert
  with check (
    client_id in (
      select linked_client_id from public.users where id = auth.uid()
    )
  );
