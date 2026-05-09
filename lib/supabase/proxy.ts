import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { REMEMBER_COOKIE, getRememberMaxAge } from "@/lib/auth/remember-me";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const rememberMaxAge = getRememberMaxAge(
    request.cookies.get(REMEMBER_COOKIE)?.value,
  );

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, {
            ...options,
            maxAge: rememberMaxAge,
          });
        }
      },
    },
  });

  await supabase.auth.getUser();

  return { response, supabase };
}
