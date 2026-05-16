"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  assertNotImpersonatingTenant,
  requireTenantSession,
} from "@/lib/auth/tenant-dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  UpdateProfileSchema,
  type UpdateProfileState,
} from "@/lib/validations/profile";
import {
  ChangePasswordSchema,
  type ChangePasswordState,
} from "@/lib/validations/password";

export async function updateProfileAction(
  _prev: UpdateProfileState | undefined,
  formData: FormData,
): Promise<UpdateProfileState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantSession(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = UpdateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as UpdateProfileState["errors"],
    };
  }

  const admin = createSupabaseAdmin();
  const { data: current, error: getErr } = await admin.auth.admin.getUserById(
    session.userId,
  );
  if (getErr || !current?.user) {
    return { errors: { _form: ["Compte introuvable"] } };
  }

  const phoneValue = parsed.data.phone?.trim() ?? "";
  const { error } = await admin.auth.admin.updateUserById(session.userId, {
    user_metadata: {
      ...(current.user.user_metadata ?? {}),
      display_name: parsed.data.fullName,
      phone: phoneValue || null,
    },
  });
  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath("/admin/reglages");
  revalidatePath("/admin");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantSession(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as ChangePasswordState["errors"],
    };
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

  return { ok: true };
}
