import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/utils/env";

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServerClient() {
  if (supabaseServerClient) {
    return supabaseServerClient;
  }

  supabaseServerClient = createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVER_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  return supabaseServerClient;
}
