import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createSupabaseBrowser() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
