"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { buildAdminAuthCallbackUrl } from "@/lib/auth/callback-url";
import {
  ForgotPasswordSchema,
  type ForgotPasswordState,
} from "@/lib/validations/auth";

export async function forgotPasswordAction(
  _prev: ForgotPasswordState | undefined,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as ForgotPasswordState["errors"] };
  }

  const admin = createSupabaseAdmin();
  const { data: userId } = await admin.rpc("get_user_id_by_email", {
    p_email: parsed.data.email,
  });

  if (userId) {
    const { data: target } = await admin.auth.admin.getUserById(userId);
    const role = target?.user?.app_metadata?.role as string | undefined;
    const disabled = Boolean(target?.user?.app_metadata?.disabled);
    if (
      role &&
      (ADMIN_ROLES as readonly string[]).includes(role) &&
      !disabled
    ) {
      const supabase = await createSupabaseServer();
      // En PKCE, Supabase ne propage pas `type=recovery` dans le redirect final
      // (seul `?code=` arrive). On passe donc explicitement `next` pour que le
      // callback route vers la page de redéfinition.
      const redirectTo = buildAdminAuthCallbackUrl("/admin/reset-password");
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo,
      });
    }
  }

  // Toujours ok=true côté UI : aucune fuite sur l'existence du compte.
  return { ok: true };
}
