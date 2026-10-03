import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseConfig(): { url: string; secretKey: string } | null {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() ?? "";
  if (!url || !secretKey) return null;
  if (!url.startsWith("https://")) return null;
  return { url, secretKey };
}

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const config = supabaseConfig();
  if (!config) {
    client = null;
    return null;
  }
  client = createClient(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
