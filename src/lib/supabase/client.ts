"use client";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createClient<Database>(url, anonKey);
}
