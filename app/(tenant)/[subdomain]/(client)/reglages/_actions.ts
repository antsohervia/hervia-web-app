"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireClientSession } from "@/lib/auth/client-dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  ChangePasswordSchema,
  type ChangePasswordState,
} from "@/lib/validations/password";

export async function changePasswordAction(
  _prev: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireClientSession(subdomain);

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as ChangePasswordState["errors"] };
  }

  if (!session.email) {
    return { errors: { _form: ["Compte sans email"] } };
  }

  const verifier = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await verifier.auth.signInWithPassword({
    email: session.email,
    password: parsed.data.currentPassword,
  });
  if (signInError) {
    return { errors: { currentPassword: ["wrongCurrent"] } };
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(session.userId, {
    password: parsed.data.newPassword,
  });
  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath("/reglages");
  return { ok: true };
}
