import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

export function createServerSupabaseClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
