"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { setRememberCookie, clearRememberCookie } from "@/lib/auth/remember-me";

// `redirectTo` est consommé côté client via window.location pour forcer une
// hard-navigation. Une `redirect()` côté serveur depuis une server action
// déclenche une soft-navigation RSC qui ignore le rewrite du proxy → 404.
export type LoginState = { error?: string; redirectTo?: string };

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const subdomain = String(formData.get("subdomain") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("remember") === "on";
  if (!subdomain || !email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status !== "active") {
    return { error: "Espace indisponible" };
  }

  await setRememberCookie(rememberMe);

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Identifiants invalides" };
  }

  const admin = createSupabaseAdmin();
  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!member) {
    await supabase.auth.signOut();
    return { error: "Compte non rattaché à cet espace" };
  }

  return { redirectTo: "/admin" };
}

export type LogoutState = { redirectTo?: string };

export async function logoutAction(
  _prev: LogoutState | undefined,
  _formData: FormData,
): Promise<LogoutState> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  await clearRememberCookie();
  return { redirectTo: "/admin/login" };
}
