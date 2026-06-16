---
name: Supabase RLS self-reference recursion
description: Why a SELECT policy that queries its own table returns HTTP 500, and the fix
---

A row-level-security policy that queries the **same table it guards** causes Postgres
"infinite recursion detected in policy for relation X" (error 42P17), which PostgREST
surfaces to the client as an HTTP **500**. Classic case: an "owners can read all"
SELECT policy on `user_profiles` doing `exists (select 1 from user_profiles where
id = auth.uid() and role = 'owner')` — evaluating that subquery re-triggers the same
SELECT policies, forever.

**Why:** RLS policies are re-applied to every query, including queries made *inside*
a policy, unless the inner query runs with RLS bypassed.

**How to apply:** put the role/ownership check in a `SECURITY DEFINER` function (mark it
`stable`, set `search_path = public`) — it bypasses RLS so it does not re-enter the
policy. Then reference that function from the policy (`using (public.is_owner())`).
Use the same helper for cross-table owner checks (products, storage.objects) so the
whole authorization graph is recursion-free.

**Related (separate) trap — client-controlled roles:** if the sign-up flow / the
`auth.users` trigger reads `role` from client-supplied `raw_user_meta_data`, any user
can self-register as `owner` and defeat every owner-gated policy. Default new users to
the least-privileged role server-side; grant `owner` only via admin SQL/RPC.
