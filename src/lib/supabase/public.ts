import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

export function createPublicClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  return createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
