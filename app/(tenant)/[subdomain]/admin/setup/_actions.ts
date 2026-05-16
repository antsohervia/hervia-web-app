"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  SetupPasswordSchema,
  type SetupPasswordState,
} from "@/lib/validations/setup";

export async function setupPasswordAction(
  _prev: SetupPasswordState | undefined,
  formData: FormData,
): Promise<SetupPasswordState> {
  const parsed = SetupPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as SetupPasswordState["errors"] };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { errors: { _form: ["Session expirée. Reconnectez-vous."] } };
  }

  const { error: pwErr } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (pwErr) return { errors: { _form: [pwErr.message] } };

  // Marque l'onboarding comme terminé : on retire `intended_role`.
  const admin = createSupabaseAdmin();
  const newMeta = { ...(user.user_metadata ?? {}) };
  delete newMeta.intended_role;
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: newMeta,
  });

  return { redirectTo: "/admin" };
}
