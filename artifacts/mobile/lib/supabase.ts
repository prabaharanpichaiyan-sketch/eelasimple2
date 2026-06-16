import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-anon-key';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function isValidHttpsUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

const urlValid = isValidHttpsUrl(rawUrl);

// Supabase's createClient expects the bare project origin (e.g.
// https://xxxx.supabase.co). Users sometimes paste the "Data API URL" which
// includes a /rest/v1/ path — strip any path so requests route correctly.
const normalizedUrl = urlValid ? new URL(rawUrl).origin : FALLBACK_URL;

export const isConfigured = urlValid && !!rawKey && rawKey.length > 0;

if (!isConfigured) {
  console.warn(
    '[supabase] Missing or invalid configuration. Check that EXPO_PUBLIC_SUPABASE_URL is a valid https://...supabase.co URL and EXPO_PUBLIC_SUPABASE_ANON_KEY is set. Network requests will fail until this is fixed.',
  );
}

// When misconfigured, use placeholder URL AND placeholder key so the real anon
// key is never sent to a non-project host. The placeholder host does not resolve,
// so requests fail fast instead of leaking credentials.
const supabaseUrl = isConfigured ? normalizedUrl : FALLBACK_URL;
const supabaseAnonKey = isConfigured && rawKey ? rawKey : FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
