---
name: Supabase env configuration in Expo
description: Diagnosing "Network request failed" and safe client construction when EXPO_PUBLIC_SUPABASE_* are misconfigured
---

## Symptom
Supabase calls on device fail with `TypeError: Network request failed` (via whatwg-fetch) even though web "renders fine". On web you also see `Invalid supabaseUrl` or `ERR_NAME_NOT_RESOLVED`.

## Most common root cause
The two secrets are SWAPPED: `EXPO_PUBLIC_SUPABASE_URL` holds the key (e.g. `sb_publishable_...`) and `EXPO_PUBLIC_SUPABASE_ANON_KEY` holds the `https://...supabase.co` URL. Verify in the shell with `grep -qE '^https?://'` (don't print secret values).

## How to apply
- Read `EXPO_PUBLIC_*` via DIRECT member access (`process.env.EXPO_PUBLIC_SUPABASE_URL`), never optional chaining — Expo's babel inliner only replaces direct member expressions at build time.
- Validate the URL is a real `https:` URL before calling `createClient`. If invalid, fall back to a placeholder URL **and** placeholder key (never send the real key to a non-project host) and `console.warn`. This keeps the app from hard-crashing at module load so the rest of the UI still renders.
- Secrets can only be changed by the user (or via the Secrets tab) — agent cannot set secret values; use `requestEnvVar` to ask for corrections.

## Supabase new key format
`sb_publishable_...` is Supabase's newer publishable key; it works as the anon/apikey in `@supabase/supabase-js`. Don't assume the anon key must be a JWT (`eyJ...`).
