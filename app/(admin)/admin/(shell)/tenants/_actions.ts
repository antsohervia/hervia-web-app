"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  requirePlatformAdmin,
  requireSuperAdmin,
  requireAdminRole,
} from "@/lib/auth/dal";
import { setImpersonation, clearImpersonation, getImpersonation } from "@/lib/auth/impersonation";
import { env, isProduction } from "@/lib/env";
import { logAudit } from "@/lib/audit/log";
import {
  CreateTenantSchema,
  DeleteTenantSchema,
  SuspendTenantSchema,
  UpdateTenantSchema,
  suggestSubdomains,
  type CreateTenantState,
  type DeleteTenantState,
  type SuspendTenantState,
  type UpdateTenantState,
} from "@/lib/validations/tenant";

function tenantOrigin(subdomain: string): string {
  return isProduction()
    ? `https://${subdomain}.${env.appDomain}`
    : `http://${subdomain}.${env.devHost}`;
}

export async function createTenantAction(
  _prev: CreateTenantState | undefined,
  formData: FormData,
): Promise<CreateTenantState> {
  const session = await requireSuperAdmin();
  const parsed = CreateTenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as CreateTenantState["errors"] };
  }
  const { name, subdomain, adminEmail, country, defaultCurrency } = parsed.data;
  const admin = createSupabaseAdmin();

  const { data: avail, error: availErr } = await admin.rpc(
    "is_subdomain_available",
    { p_subdomain: subdomain },
  );
  if (availErr) return { errors: { _form: [availErr.message] } };
  if (!avail) {
    const candidates = suggestSubdomains(subdomain);
    const checks = await Promise.all(
      candidates.map((c) =>
        admin.rpc("is_subdomain_available", { p_subdomain: c }),
      ),
    );
    const suggestions = candidates.filter((_, i) => checks[i]?.data === true);
    return {
      errors: { subdomain: ["Sous-domaine indisponible"] },
      suggestions,
    };
  }

  const { data: tenant, error: tErr } = await admin
    .from("tenants")
    .insert({
      name,
      subdomain,
      country,
      default_currency: defaultCurrency,
    })
    .select("id, subdomain")
    .single();
  if (tErr || !tenant) {
    return { errors: { _form: [tErr?.message ?? "Échec création tenant"] } };
  }

  const redirectTo = `${tenantOrigin(subdomain)}/auth/callback`;
  const { data: invited, error: invErr } =
    await admin.auth.admin.inviteUserByEmail(adminEmail, {
      redirectTo,
      data: {
        tenant_id: tenant.id,
        intended_role: "entreprise_admin",
        tenant_name: name,
      },
    });

  if (invErr || !invited?.user) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    return {
      errors: {
        _form: [`Échec de l'invitation: ${invErr?.message ?? "inconnu"}`],
      },
    };
  }

  await admin.auth.admin.updateUserById(invited.user.id, {
    app_metadata: {
      role: "entreprise_admin",
      tenant_id: tenant.id,
    },
  });

  await admin.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: invited.user.id,
    role: "entreprise_admin",
    invited_by: session.user.id,
  });

  await admin.from("audit_logs").insert({
    actor_id: session.user.id,
    actor_email: session.user.email,
    action: "tenant.create",
    tenant_id: tenant.id,
    payload: { name, subdomain, adminEmail, country, defaultCurrency },
  });

  revalidatePath("/admin/tenants");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/tenants/${tenant.id}`);
}

export async function suspendTenantAction(
  _prev: SuspendTenantState | undefined,
  formData: FormData,
): Promise<SuspendTenantState> {
  const session = await requireSuperAdmin();
  const parsed = SuspendTenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as SuspendTenantState["errors"] };
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("tenants")
    .update({
      status: "suspended",
      suspension_reason: parsed.data.reason,
      suspension_note: parsed.data.note?.trim() || null,
      suspension_message: parsed.data.message?.trim() || null,
      suspended_at: new Date().toISOString(),
      suspended_by: session.user.id,
    })
    .eq("id", parsed.data.tenantId)
    .eq("status", "active");

  if (error) return { errors: { _form: [error.message] } };

  const { data: members } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", parsed.data.tenantId)
    .eq("role", "entreprise_admin");

  await admin.from("audit_logs").insert({
    actor_id: session.user.id,
    actor_email: session.user.email,
    action: "tenant.suspend",
    tenant_id: parsed.data.tenantId,
    payload: {
      reason: parsed.data.reason,
      note: parsed.data.note ?? null,
      notified_user_ids: members?.map((m) => m.user_id) ?? [],
    },
  });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${parsed.data.tenantId}`);
  return { ok: true };
}

export async function reactivateTenantAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) throw new Error("tenantId manquant");

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("tenants")
    .update({
      status: "active",
      suspension_reason: null,
      suspension_note: null,
      suspension_message: null,
      suspended_at: null,
      suspended_by: null,
    })
    .eq("id", tenantId)
    .eq("status", "suspended");

  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    actor_id: session.user.id,
    actor_email: session.user.email,
    action: "tenant.reactivate",
    tenant_id: tenantId,
    payload: {},
  });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
}

export async function deleteTenantAction(
  _prev: DeleteTenantState | undefined,
  formData: FormData,
): Promise<DeleteTenantState> {
  const session = await requireSuperAdmin();
  const parsed = DeleteTenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as DeleteTenantState["errors"] };
  }

  const admin = createSupabaseAdmin();
  const { data: tenant, error: getErr } = await admin
    .from("tenants")
    .select("id, subdomain, status")
    .eq("id", parsed.data.tenantId)
    .single();

  if (getErr || !tenant) return { errors: { _form: ["Tenant introuvable"] } };
  if (tenant.status !== "suspended") {
    return {
      errors: { _form: ["Le tenant doit être suspendu avant suppression"] },
    };
  }
  if (
    tenant.subdomain.toLowerCase() !== parsed.data.confirmedSubdomain.toLowerCase()
  ) {
    return {
      errors: {
        confirmedSubdomain: ["La saisie ne correspond pas au sous-domaine"],
      },
    };
  }

  const cookieStore = await cookies();
  if (cookieStore.get(`tenant-export-ok:${tenant.id}`)?.value !== "1") {
    return {
      errors: {
        _form: ["L'export ZIP doit être téléchargé avant suppression"],
      },
    };
  }

  await admin
    .from("tenants")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", tenant.id);

  const releasedAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  await admin
    .from("tenant_subdomain_quarantine")
    .upsert({
      subdomain: tenant.subdomain,
      released_at: releasedAt,
      former_tenant: tenant.id,
    });

  await admin.from("audit_logs").insert({
    actor_id: session.user.id,
    actor_email: session.user.email,
    action: "tenant.delete",
    tenant_id: tenant.id,
    payload: { quarantined_until: releasedAt },
  });

  cookieStore.delete(`tenant-export-ok:${tenant.id}`);
  revalidatePath("/admin/tenants");
  revalidatePath("/admin/dashboard");
  redirect("/admin/tenants");
}

export async function impersonateTenantAction(formData: FormData): Promise<void> {
  const session = await requireAdminRole(["super_admin", "admin_support"]);
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) throw new Error("tenantId manquant");

  const admin = createSupabaseAdmin();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, subdomain, status")
    .eq("id", tenantId)
    .single();
  if (!tenant) throw new Error("Tenant introuvable");

  await admin.from("audit_logs").insert({
    actor_id: session.user.id,
    actor_email: session.user.email,
    action: "tenant.impersonate.start",
    tenant_id: tenantId,
    payload: {},
  });

  await setImpersonation(tenantId);
  redirect(`${tenantOrigin(tenant.subdomain)}/`);
}

export async function updateTenantAction(
  _prev: UpdateTenantState | undefined,
  formData: FormData,
): Promise<UpdateTenantState> {
  const session = await requireSuperAdmin();
  const parsed = UpdateTenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as UpdateTenantState["errors"] };
  }
  const { tenantId, name, adminEmail, country, defaultCurrency, timezone } =
    parsed.data;

  const admin = createSupabaseAdmin();
  const { data: tenant, error: getErr } = await admin
    .from("tenants")
    .select(
      "id, name, country, default_currency, timezone, status, subdomain",
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (getErr || !tenant) return { errors: { _form: ["Tenant introuvable"] } };
  if (tenant.status === "deleted") {
    return {
      errors: { _form: ["Le tenant est supprimé et ne peut plus être modifié"] },
    };
  }

  const { data: currentMember } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("role", "entreprise_admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let oldAdminEmail: string | null = null;
  if (currentMember?.user_id) {
    const { data: oldUser } = await admin.auth.admin.getUserById(
      currentMember.user_id as string,
    );
    oldAdminEmail = oldUser?.user?.email ?? null;
  }

  const emailChanged =
    !!oldAdminEmail && oldAdminEmail.toLowerCase() !== adminEmail.toLowerCase();

  if (emailChanged) {
    const { data: invited, error: invErr } =
      await admin.auth.admin.inviteUserByEmail(adminEmail, {
        redirectTo: `${tenantOrigin(tenant.subdomain as string)}/auth/callback`,
        data: {
          tenant_id: tenantId,
          intended_role: "entreprise_admin",
          tenant_name: name,
        },
      });
    if (invErr || !invited?.user) {
      return {
        errors: {
          _form: [`Échec de l'invitation: ${invErr?.message ?? "inconnu"}`],
        },
      };
    }
    await admin.auth.admin.updateUserById(invited.user.id, {
      app_metadata: {
        role: "entreprise_admin",
        tenant_id: tenantId,
      },
    });
    // Le précédent administrateur n'est pas supprimé : on transfère uniquement
    // le rôle d'administrateur principal vers le nouveau compte.
    await admin.from("tenant_members").upsert(
      {
        tenant_id: tenantId,
        user_id: invited.user.id,
        role: "entreprise_admin",
        invited_by: session.user.id,
      },
      { onConflict: "tenant_id,user_id" },
    );
    // TODO: notifier par email l'ancien et le nouveau contact (US-A1.4)
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (tenant.name !== name) changes.name = { from: tenant.name, to: name };
  if (tenant.country !== country)
    changes.country = { from: tenant.country, to: country };
  if (tenant.default_currency !== defaultCurrency)
    changes.default_currency = {
      from: tenant.default_currency,
      to: defaultCurrency,
    };
  if (tenant.timezone !== timezone)
    changes.timezone = { from: tenant.timezone, to: timezone };
  if (emailChanged)
    changes.admin_email = { from: oldAdminEmail, to: adminEmail };

  const { error: updErr } = await admin
    .from("tenants")
    .update({
      name,
      country,
      default_currency: defaultCurrency,
      timezone,
    })
    .eq("id", tenantId);
  if (updErr) return { errors: { _form: [updErr.message] } };

  await logAudit({
    session,
    action: "tenant.update",
    tenantId,
    payload: { changes },
    client: admin,
  });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath(`/admin/tenants/${tenantId}/edit`);
  return { ok: true };
}

export async function endImpersonationAction(): Promise<void> {
  const session = await requirePlatformAdmin();
  const tenantId = await getImpersonation();
  await clearImpersonation();
  if (tenantId) {
    const admin = createSupabaseAdmin();
    await admin.from("audit_logs").insert({
      actor_id: session.user.id,
      actor_email: session.user.email,
      action: "tenant.impersonate.end",
      tenant_id: tenantId,
      payload: {},
    });
  }
  redirect("/admin/tenants");
}
