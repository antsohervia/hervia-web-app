"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import {
  ResetPasswordSchema,
  type ResetPasswordState,
} from "@/lib/validations/auth";

export async function resetPasswordAction(
  _prev: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  const subdomain = String(formData.get("subdomain") ?? "").trim();
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as ResetPasswordState["errors"] };
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
  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    await supabase.auth.signOut();
    return { errors: { _form: ["Compte non rattaché à cet espace."] } };
  }

  const { error: pwErr } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (pwErr) return { errors: { _form: [pwErr.message] } };

  return { redirectTo: "/admin" };
}
