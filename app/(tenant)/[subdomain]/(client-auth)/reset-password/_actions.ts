"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import {
  ClientResetPasswordSchema,
  type ClientResetPasswordState,
} from "@/lib/validations/client-auth";

export async function clientResetPasswordAction(
  _prev: ClientResetPasswordState | undefined,
  formData: FormData,
): Promise<ClientResetPasswordState> {
  const subdomain = String(formData.get("subdomain") ?? "").trim();
  const parsed = ClientResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as ClientResetPasswordState["errors"],
    };
  }

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status !== "active") {
    return { errors: { _form: ["Espace indisponible."] } };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      errors: {
        _form: [
          "Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.",
        ],
      },
    };
  }

  const admin = createSupabaseAdmin();
  const { data: client } = await admin
    .from("clients")
    .select("id, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!client) {
    await supabase.auth.signOut();
    return { errors: { _form: ["Compte non rattaché à cet espace."] } };
  }
  if (client.status === "disabled") {
    await supabase.auth.signOut();
    return { errors: { _form: ["Votre compte est désactivé."] } };
  }

  const { error: pwErr } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (pwErr) return { errors: { _form: [pwErr.message] } };

  return { redirectTo: "/" };
}
