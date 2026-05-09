"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { buildTenantAuthCallbackUrl } from "@/lib/auth/callback-url";
import {
  ClientForgotPasswordSchema,
  type ClientForgotPasswordState,
} from "@/lib/validations/client-auth";

export async function clientForgotPasswordAction(
  _prev: ClientForgotPasswordState | undefined,
  formData: FormData,
): Promise<ClientForgotPasswordState> {
  const subdomain = String(formData.get("subdomain") ?? "").trim();
  const parsed = ClientForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as ClientForgotPasswordState["errors"],
    };
  }

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status !== "active") {
    return { errors: { _form: ["Espace indisponible."] } };
  }

  const admin = createSupabaseAdmin();

  // L'envoi n'a lieu que si l'email correspond à un client *de ce tenant*.
  // On reste générique côté UI dans tous les cas (US-C1.2).
  const { data: client } = await admin
    .from("clients")
    .select("id, user_id")
    .eq("tenant_id", tenant.id)
    .ilike("email", parsed.data.email)
    .maybeSingle();

  if (client && client.user_id) {
    const supabase = await createSupabaseServer();
    const redirectTo = buildTenantAuthCallbackUrl(
      subdomain,
      "/reset-password",
    );
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo,
    });
  }

  return { ok: true };
}
