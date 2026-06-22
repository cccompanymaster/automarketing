// Supabase client (lazy, env-gated). Returns null when not configured, which
// keeps the app fully functional in local "stub" mode. Add
// NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to switch the auth
// and wallet layers to the real backend with no code changes.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env is present (real backend mode). */
export const isSupabaseConfigured = Boolean(URL && ANON);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null; // client-side only
  if (!client) client = createClient(URL as string, ANON as string);
  return client;
}
