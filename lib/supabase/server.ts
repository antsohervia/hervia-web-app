import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { REMEMBER_COOKIE, getRememberMaxAge } from "@/lib/auth/remember-me";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const rememberMaxAge = getRememberMaxAge(
    cookieStore.get(REMEMBER_COOKIE)?.value,
  );

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, {
              ...options,
              maxAge: rememberMaxAge,
            });
          }
        } catch {
          // Setting cookies from a Server Component is a no-op; the proxy
          // refreshes the session on the next request.
        }
      },
    },
  });
}
