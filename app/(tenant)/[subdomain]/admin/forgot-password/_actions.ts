"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { buildTenantAuthCallbackUrl } from "@/lib/auth/callback-url";
import {
  ForgotPasswordSchema,
  type ForgotPasswordState,
} from "@/lib/validations/auth";

export async function forgotPasswordAction(
  _prev: ForgotPasswordState | undefined,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const subdomain = String(formData.get("subdomain") ?? "").trim();
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as ForgotPasswordState["errors"] };
  }

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status !== "active") {
    return { errors: { _form: ["Espace indisponible."] } };
  }

  const admin = createSupabaseAdmin();

  const { data: userId } = await admin.rpc("get_user_id_by_email", {
    p_email: parsed.data.email,
  });

  if (userId) {
    const { data: member } = await admin
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (member) {
      const supabase = await createSupabaseServer();
      // En PKCE, Supabase ne propage pas `type=recovery` dans le redirect final
      // (seul `?code=` arrive). On passe donc explicitement `next` pour que le
      // callback route vers la page de redéfinition.
      const redirectTo = buildTenantAuthCallbackUrl(
        subdomain,
        "/admin/reset-password",
      );
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo,
      });
    }
  }

  // Toujours ok=true côté UI : aucune fuite sur l'existence du compte ni
  // sur son appartenance au tenant.
  return { ok: true };
}
