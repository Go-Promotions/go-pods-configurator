import { createClient } from "@supabase/supabase-js";

import { getServiceRoleSupabaseEnv } from "@/lib/supabase/config";

export function createServiceRoleSupabaseClient() {
  const { url, serviceRoleKey } = getServiceRoleSupabaseEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
