"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { buildTenantAuthCallbackUrl } from "@/lib/auth/callback-url";
import {
  ClientSignupSchema,
  type ClientSignupState,
} from "@/lib/validations/client-auth";

export async function clientSignupAction(
  _prev: ClientSignupState | undefined,
  formData: FormData,
): Promise<ClientSignupState> {
  const subdomain = String(formData.get("subdomain") ?? "").trim();
  const parsed = ClientSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    role: formData.get("role"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    cgu: formData.get("cgu"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as ClientSignupState["errors"],
    };
  }
  const data = parsed.data;

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status !== "active") {
    return { errors: { _form: ["Espace indisponible."] } };
  }

  const admin = createSupabaseAdmin();

  // Unicité de l'email pour ce tenant (US-C1.3)
  const { data: existing } = await admin
    .from("clients")
    .select("id, status")
    .eq("tenant_id", tenant.id)
    .ilike("email", data.email)
    .maybeSingle();

  // Si un compte `pending_activation` existe depuis > 24h : on le purge et on
  // recrée. Sinon : retour générique (pas de fuite d'existence). Le client
  // existant reçoit un email d'information côté Supabase si configuré.
  if (existing) {
    if (existing.status === "pending_activation") {
      const { data: row } = await admin
        .from("clients")
        .select("created_at")
        .eq("id", existing.id)
        .maybeSingle();
      const createdAt = row?.created_at
        ? new Date(row.created_at as string)
        : null;
      const expired =
        createdAt && Date.now() - createdAt.getTime() > 24 * 3600 * 1000;
      if (expired) {
        await admin.from("clients").delete().eq("id", existing.id);
      } else {
        return { ok: true };
      }
    } else {
      return { ok: true };
    }
  }

  const supabase = await createSupabaseServer();
  const redirectTo = buildTenantAuthCallbackUrl(subdomain, "/");

  const { data: signup, error: signupErr } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        full_name: data.fullName,
        tenant_subdomain: subdomain,
        role: data.role,
      },
    },
  });
  if (signupErr || !signup.user) {
    // Cas typique : email déjà utilisé sur la plateforme (autre tenant).
    // On reste générique côté UI.
    return { ok: true };
  }

  await admin.from("clients").insert({
    tenant_id: tenant.id,
    user_id: signup.user.id,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    status: "pending_activation",
    email_notifications_enabled: true,
  });

  return { ok: true };
}
