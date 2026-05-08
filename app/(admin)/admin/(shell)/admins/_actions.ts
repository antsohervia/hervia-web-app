"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/roles";
import {
  CreateAdminSchema,
  DisableAdminSchema,
  ReactivateAdminSchema,
  UpdateAdminRoleSchema,
  type CreateAdminState,
  type UpdateAdminRoleState,
} from "@/lib/validations/admin";
import { logAudit } from "@/lib/audit/log";
import { countActiveSuperAdmins } from "@/lib/admins/repo";

const PERMA_BAN_DURATION = "876600h";

export async function createAdminAction(
  _prev: CreateAdminState | undefined,
  formData: FormData,
): Promise<CreateAdminState> {
  const session = await requireSuperAdmin();
  const parsed = CreateAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as CreateAdminState["errors"] };
  }
  const { email, role } = parsed.data;
  const admin = createSupabaseAdmin();

  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${origin()}/admin/login`,
      data: { intended_role: role, scope: "platform" },
    },
  );
  if (invErr || !invited?.user) {
    return {
      errors: {
        _form: [`Échec de l'invitation: ${invErr?.message ?? "inconnu"}`],
      },
    };
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(
    invited.user.id,
    {
      app_metadata: { role, disabled: false },
    },
  );
  if (updErr) {
    return { errors: { _form: [`Échec d'attribution du rôle: ${updErr.message}`] } };
  }

  await logAudit({
    session,
    action: "admin.create",
    payload: { admin_id: invited.user.id, admin_email: email, role },
  });

  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function updateAdminRoleAction(
  _prev: UpdateAdminRoleState | undefined,
  formData: FormData,
): Promise<UpdateAdminRoleState> {
  const session = await requireSuperAdmin();
  const parsed = UpdateAdminRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as UpdateAdminRoleState["errors"] };
  }
  const { adminId, role } = parsed.data;
  if (adminId === session.user.id) {
    return { errors: { _form: ["Vous ne pouvez pas modifier votre propre rôle"] } };
  }

  const admin = createSupabaseAdmin();
  const { data: target, error: getErr } = await admin.auth.admin.getUserById(adminId);
  if (getErr || !target?.user) {
    return { errors: { _form: ["Compte introuvable"] } };
  }
  const currentRole = target.user.app_metadata?.role as AdminRole | undefined;
  const currentDisabled = Boolean(target.user.app_metadata?.disabled);
  if (!currentRole || !(ADMIN_ROLES as readonly string[]).includes(currentRole)) {
    return { errors: { _form: ["Le compte cible n'est pas un admin plateforme"] } };
  }

  if (
    currentRole === "super_admin" &&
    role !== "super_admin" &&
    !currentDisabled
  ) {
    const remaining = await countActiveSuperAdmins();
    if (remaining <= 1) {
      return {
        errors: {
          _form: ["Impossible de dégrader le dernier Super Admin actif"],
        },
      };
    }
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(adminId, {
    app_metadata: {
      ...(target.user.app_metadata ?? {}),
      role,
    },
  });
  if (updErr) return { errors: { _form: [updErr.message] } };

  await logAudit({
    session,
    action: "admin.update_role",
    payload: { admin_id: adminId, from: currentRole, to: role },
  });

  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function disableAdminAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const parsed = DisableAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Paramètres invalides");
  const { adminId } = parsed.data;
  if (adminId === session.user.id) {
    throw new Error("Vous ne pouvez pas désactiver votre propre compte");
  }

  const admin = createSupabaseAdmin();
  const { data: target, error: getErr } = await admin.auth.admin.getUserById(adminId);
  if (getErr || !target?.user) throw new Error("Compte introuvable");

  const currentRole = target.user.app_metadata?.role as AdminRole | undefined;
  if (!currentRole || !(ADMIN_ROLES as readonly string[]).includes(currentRole)) {
    throw new Error("Le compte cible n'est pas un admin plateforme");
  }

  if (currentRole === "super_admin") {
    const remaining = await countActiveSuperAdmins();
    if (remaining <= 1) {
      throw new Error("Impossible de désactiver le dernier Super Admin actif");
    }
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(adminId, {
    ban_duration: PERMA_BAN_DURATION,
    app_metadata: {
      ...(target.user.app_metadata ?? {}),
      disabled: true,
    },
  });
  if (updErr) throw new Error(updErr.message);

  await logAudit({
    session,
    action: "admin.disable",
    payload: { admin_id: adminId, admin_email: target.user.email },
  });

  revalidatePath("/admin/admins");
}

export async function reactivateAdminAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const parsed = ReactivateAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Paramètres invalides");
  const { adminId } = parsed.data;

  const admin = createSupabaseAdmin();
  const { data: target, error: getErr } = await admin.auth.admin.getUserById(adminId);
  if (getErr || !target?.user) throw new Error("Compte introuvable");

  const { error: updErr } = await admin.auth.admin.updateUserById(adminId, {
    ban_duration: "none",
    app_metadata: {
      ...(target.user.app_metadata ?? {}),
      disabled: false,
    },
  });
  if (updErr) throw new Error(updErr.message);

  await logAudit({
    session,
    action: "admin.reactivate",
    payload: { admin_id: adminId, admin_email: target.user.email },
  });

  revalidatePath("/admin/admins");
}

function origin(): string {
  // L'invite admin redirige vers le sous-domaine "admin" en prod, "admin.localhost" en dev.
  // On laisse Supabase utiliser le SITE_URL configuré comme fallback ; on construit ici une
  // base raisonnable côté serveur si possible.
  const host =
    process.env.NEXT_PUBLIC_APP_DOMAIN ?? process.env.NEXT_PUBLIC_DEV_HOST ?? "";
  if (!host) return "";
  if (host.includes("localhost")) return `http://admin.${host}`;
  return `https://admin.${host}`;
}
