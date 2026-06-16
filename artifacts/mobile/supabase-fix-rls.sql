-- ============================================================
-- FIX: infinite recursion in user_profiles RLS policies
-- ------------------------------------------------------------
-- The original "Owners can view all profiles" policy queried
-- user_profiles from within a SELECT policy ON user_profiles,
-- which Postgres rejects with:
--   "infinite recursion detected in policy for relation user_profiles"
-- causing PostgREST to return HTTP 500 when the app loads a profile.
--
-- Run this entire script once in the Supabase SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- It is idempotent and safe to run more than once.
-- ============================================================

-- SECURITY DEFINER helper bypasses RLS, so it does not re-trigger
-- the user_profiles policies (no recursion).
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

drop policy if exists "Owners can view all profiles" on public.user_profiles;
create policy "Owners can view all profiles"
  on public.user_profiles for select
  using (public.is_owner());

drop policy if exists "Owners can manage products" on public.products;
create policy "Owners can manage products"
  on public.products for all
  using (public.is_owner());

drop policy if exists "Owners can delete product images" on storage.objects;
create policy "Owners can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and public.is_owner()
  );
