-- ============================================================
-- Bakery Manager — Supabase Migration
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (mirrors auth.users, extended with role)
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'staff' check (role in ('owner', 'staff')),
  created_at  timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default '',
  description text not null default '',
  price       numeric(10,2) not null default 0,
  image_url   text not null default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Customers
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null default '',
  email       text not null default '',
  address     text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique,
  customer_id   uuid references public.customers(id) on delete set null,
  order_date    date not null default current_date,
  delivery_date date,
  status        text not null default 'pending'
                  check (status in ('pending','confirmed','preparing','ready','delivered','cancelled')),
  subtotal      numeric(10,2) not null default 0,
  discount      numeric(10,2) not null default 0,
  grand_total   numeric(10,2) not null default 0,
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

-- Order items
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  quantity    integer not null default 1 check (quantity > 0),
  price       numeric(10,2) not null default 0,
  line_total  numeric(10,2) not null default 0
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_status_idx       on public.orders(status);
create index if not exists orders_order_date_idx   on public.orders(order_date desc);
create index if not exists order_items_order_id_idx   on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table public.user_profiles enable row level security;
alter table public.products       enable row level security;
alter table public.customers      enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

-- user_profiles: users can read their own row; owners can read all
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Owners can view all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'owner'
    )
  );

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Products: all authenticated users can read; owners can write
create policy "Authenticated users can read products"
  on public.products for select
  using (auth.role() = 'authenticated');

create policy "Owners can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'owner'
    )
  );

-- Customers: all authenticated users can read and write
create policy "Authenticated users can read customers"
  on public.customers for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage customers"
  on public.customers for all
  using (auth.role() = 'authenticated');

-- Orders: all authenticated users can read and write
create policy "Authenticated users can read orders"
  on public.orders for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage orders"
  on public.orders for all
  using (auth.role() = 'authenticated');

-- Order items: all authenticated users can read and write
create policy "Authenticated users can read order_items"
  on public.order_items for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage order_items"
  on public.order_items for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGN-UP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET FOR PRODUCT IMAGES
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Authenticated users can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Owners can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'owner'
    )
  );
