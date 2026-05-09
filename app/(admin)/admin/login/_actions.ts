"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { setRememberCookie, clearRememberCookie } from "@/lib/auth/remember-me";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("remember") === "on";
  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
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
  const role = data.user.app_metadata?.role as string | undefined;
  const disabled = Boolean(data.user.app_metadata?.disabled);
  if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
    await supabase.auth.signOut();
    return { error: "Compte non autorisé" };
  }
  if (disabled) {
    await supabase.auth.signOut();
    return { error: "Compte désactivé. Contactez un Super Admin." };
  }
  redirect("/admin/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  await clearRememberCookie();
  redirect("/admin/login");
}
