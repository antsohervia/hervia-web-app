"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import {
  ResetPasswordSchema,
  type ResetPasswordState,
} from "@/lib/validations/auth";

export async function resetPasswordAction(
  _prev: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as ResetPasswordState["errors"] };
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

  const role = user.app_metadata?.role as string | undefined;
  if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
    await supabase.auth.signOut();
    return { errors: { _form: ["Compte non autorisé."] } };
  }

  const { error: pwErr } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (pwErr) return { errors: { _form: [pwErr.message] } };

  redirect("/admin/dashboard");
}
