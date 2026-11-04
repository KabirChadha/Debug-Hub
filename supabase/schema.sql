-- ============================================================================
-- CAMPUS CODE FIX: Supabase Database Schema & Storage Configuration
-- Authentication, Database Tracking, and File Storage
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 2. STATUS ENUM TYPE
-- Status: 'submitted', 'in_progress', 'proof_ready', 'completed'
do $$ begin
  create type order_status as enum (
    'submitted',
    'in_progress',
    'proof_ready',
    'completed'
  );
exception
  when duplicate_object then null;
end $$;

-- 3. ORDERS TABLE
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  contact_handle text not null,
  tech_stack text not null,
  issue_description text not null,
  status order_status not null default 'submitted',
  file_name text null,
  file_storage_path text null,
  zip_storage_path text null,
  proof_video_url text null,
  fixed_zip_url text null,
  user_id uuid null references auth.users(id),
  user_email text null,
  utr_number text null,
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);

-- Backward compatibility migration columns
alter table public.orders add column if not exists file_name text;
alter table public.orders add column if not exists file_storage_path text;
alter table public.orders alter column zip_storage_path drop not null;
alter table public.orders add column if not exists user_id uuid references auth.users(id);
alter table public.orders add column if not exists user_email text;
alter table public.orders add column if not exists utr_number text;
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders add column if not exists is_paid boolean default false;
alter table public.orders add column if not exists updated_at timestamptz default now();
alter table public.orders add column if not exists deliverable_url text;
alter table public.orders add column if not exists deliverable_storage_path text;
alter table public.orders add column if not exists deliverable_file_name text;

-- Enable Realtime publication on orders table
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Index for instant lookup by order_code
create index if not exists idx_orders_order_code on public.orders (order_code);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- 4. ORDER CODE HELPER FUNCTION (OPTIONAL AUTO-GENERATION)
-- Generates unique codes in format 'FIX-XXXX' if order_code is not supplied
create or replace function public.generate_order_code()
returns trigger as $$
declare
  new_code text;
  done bool;
begin
  if new.order_code is null or trim(new.order_code) = '' then
    done := false;
    while not done loop
      new_code := 'FIX-' || lpad(floor(random() * 10000)::text, 4, '0');
      if not exists (select 1 from public.orders where order_code = new_code) then
        done := true;
      end if;
    end loop;
    new.order_code := new_code;
  end if;
  return new;
end;
$$ language plpgsql volatile;

drop trigger if exists trigger_generate_order_code on public.orders;
create trigger trigger_generate_order_code
  before insert on public.orders
  for each row
  execute function public.generate_order_code();

-- 5. ROW LEVEL SECURITY (RLS) ON ORDERS
alter table public.orders enable row level security;

-- Policy 1: Allow public inserts for new orders
-- Anyone (students/anonymous clients) can submit a new order
drop policy if exists "Allow public inserts for new orders" on public.orders;
create policy "Allow public inserts for new orders"
  on public.orders
  for insert
  to public
  with check (true);

-- Policy 2: Public reads restricted by order_code
-- Allows clients to view order details when querying with the specific order_code
drop policy if exists "Allow public reads restricted by order_code" on public.orders;
create policy "Allow public reads restricted by order_code"
  on public.orders
  for select
  to public
  using (
    order_code is not null
  );

-- Policy 3: Admin full access
-- Service role and admin authenticated accounts have complete access to select, insert, update, delete
drop policy if exists "Admin full access" on public.orders;
create policy "Admin full access"
  on public.orders
  for all
  to authenticated, service_role
  using (
    auth.jwt() ->> 'role' = 'service_role'
    or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    or (auth.jwt() ->> 'email') like '%@campuscodefix.com'
  )
  with check (
    auth.jwt() ->> 'role' = 'service_role'
    or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    or (auth.jwt() ->> 'email') like '%@campuscodefix.com'
  );

-- 6. SECURE RPC LOOKUP FUNCTION
-- Helper to look up an order securely by order_code
create or replace function public.get_order_by_code(p_order_code text)
returns setof public.orders
language sql
security definer
set search_path = public
as $$
  select * from public.orders
  where upper(order_code) = upper(trim(p_order_code))
  limit 1;
$$;

-- Grant execution to public
grant execute on function public.get_order_by_code(text) to anon, authenticated, service_role;


-- ============================================================================
-- STORAGE CONFIGURATION (Supabase Storage)
-- Buckets: 'project-intakes' and 'deliverables'
-- ============================================================================

-- 1. Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'project-intakes',
    'project-intakes',
    false, -- Private: intake code archives & source files are confidential & encrypted
    104857600, -- 100 MB max file size
    null -- Allows all source files (.py, .c, .cpp, etc.), documents (.docx, .pdf), and archives
  ),
  (
    'deliverables',
    'deliverables',
    false, -- Private: accessed via signed URLs or admin credentials
    524288000, -- 500 MB max file size for deliverables & demo videos
    null -- Allows archives, videos, documents, and source deliverables
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage RLS Policies for 'project-intakes'
-- Allow public / anon users to upload project archives
drop policy if exists "Public upload project-intakes" on storage.objects;
create policy "Public upload project-intakes"
  on storage.objects
  for insert
  to public
  with check (bucket_id = 'project-intakes');

-- Only service role / admin can view or download raw intake archives
drop policy if exists "Admin read project-intakes" on storage.objects;
create policy "Admin read project-intakes"
  on storage.objects
  for select
  to authenticated, service_role
  using (
    bucket_id = 'project-intakes'
    and (
      auth.jwt() ->> 'role' = 'service_role'
      or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    )
  );

-- 3. Storage RLS Policies for 'deliverables'
-- Admin / service role can upload fixed solution archives and proof videos
drop policy if exists "Admin upload deliverables" on storage.objects;
create policy "Admin upload deliverables"
  on storage.objects
  for insert
  to authenticated, service_role
  with check (
    bucket_id = 'deliverables'
    and (
      auth.jwt() ->> 'role' = 'service_role'
      or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    )
  );

-- Admin / service role can update or delete deliverables
drop policy if exists "Admin manage deliverables" on storage.objects;
create policy "Admin manage deliverables"
  on storage.objects
  for all
  to authenticated, service_role
  using (
    bucket_id = 'deliverables'
    and (
      auth.jwt() ->> 'role' = 'service_role'
      or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    )
  );

-- Deliverable reading: Accessible via signed URL or if client is authorized
drop policy if exists "Read deliverables via storage" on storage.objects;
create policy "Read deliverables via storage"
  on storage.objects
  for select
  to public
  using (bucket_id = 'deliverables');

