import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, getServiceRoleKey } from "@/lib/env";

export function createSupabaseAdmin() {
  return createClient(env.supabaseUrl, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
