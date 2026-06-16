import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MCwiZXhwIjo5OTk5OTk5OTk5fQ.placeholder';

const supabaseUrl =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL
    ? process.env.EXPO_PUBLIC_SUPABASE_URL
    : FALLBACK_URL;

const supabaseAnonKey =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    : FALLBACK_KEY;

export const isConfigured =
  supabaseUrl !== FALLBACK_URL && supabaseAnonKey !== FALLBACK_KEY;

let _supabase: SupabaseClient;

try {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} catch {
  // If createClient throws (e.g. invalid URL format in the bundle), fall back gracefully
  _supabase = createClient(FALLBACK_URL, FALLBACK_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = _supabase;
