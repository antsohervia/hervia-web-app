"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { setRememberCookie, clearRememberCookie } from "@/lib/auth/remember-me";
import {
  ClientLoginSchema,
  type ClientLoginState,
} from "@/lib/validations/client-auth";
import { touchClientLastLogin } from "@/lib/clients/repo";

export async function clientLoginAction(
  _prev: ClientLoginState | undefined,
  formData: FormData,
): Promise<ClientLoginState> {
  const subdomain = String(formData.get("subdomain") ?? "").trim();
  const rememberMe = formData.get("remember") === "on";

  const parsed = ClientLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Email ou mot de passe incorrect" };
  }

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status !== "active") {
    return { error: "Espace indisponible" };
  }

  await setRememberCookie(rememberMe);

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Message générique : pas de fuite sur l'existence de l'email.
  if (error || !data.user) {
    return { error: "Email ou mot de passe incorrect" };
  }

  const admin = createSupabaseAdmin();

  // Vérification : le user n'est pas un membre tenant-admin de cet espace.
  const { data: member } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (member) {
    await supabase.auth.signOut();
    return {
      error:
        "Ce compte appartient à l'équipe de l'espace. Connectez-vous via /admin/login.",
    };
  }

  const { data: client } = await admin
    .from("clients")
    .select("id, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!client) {
    await supabase.auth.signOut();
    return { error: "Email ou mot de passe incorrect" };
  }

  if (client.status === "disabled") {
    await supabase.auth.signOut();
    return {
      error: `Votre compte est temporairement désactivé. Contactez ${tenant.name} pour plus d'informations.`,
    };
  }

  if (client.status === "pending_activation") {
    await supabase.auth.signOut();
    return {
      error:
        "Votre compte n'est pas encore activé. Vérifiez votre email pour le lien d'activation.",
    };
  }

  await touchClientLastLogin(client.id as string);

  return { redirectTo: "/" };
}

export type ClientLogoutState = { redirectTo?: string };

export async function clientLogoutAction(
  _prev: ClientLogoutState | undefined,
  _formData: FormData,
): Promise<ClientLogoutState> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  await clearRememberCookie();
  return { redirectTo: "/login" };
}
