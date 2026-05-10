"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertNotImpersonatingTenant,
  requireTenantAdmin,
} from "@/lib/auth/tenant-dal";
import { logTenantAudit } from "@/lib/parcels/audit";
import {
  CreateStatusSchema,
  UpdateStatusSchema,
  type StatusFormState,
} from "@/lib/validations/parcel-status";
import { autoTranslateLabel } from "@/lib/i18n/auto-translate";
import { updateStatusLabelTranslations } from "@/lib/parcels/repo";

const MIN_STATUSES = 2;

export async function createStatusAction(
  _prev: StatusFormState | undefined,
  formData: FormData,
): Promise<StatusFormState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = CreateStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as StatusFormState["errors"] };
  }

  const admin = createSupabaseAdmin();

  if (parsed.data.type === "initial") {
    const { count } = await admin
      .from("parcel_statuses")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.tenant.id)
      .eq("type", "initial");
    if ((count ?? 0) > 0) {
      return {
        errors: {
          type: ["Un statut initial existe déjà. Modifiez-le ou changez de type."],
        },
      };
    }
  }

  const { data: maxRow } = await admin
    .from("parcel_statuses")
    .select("position")
    .eq("tenant_id", session.tenant.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((maxRow?.position as number | undefined) ?? 0) + 10;

  const { error } = await admin.from("parcel_statuses").insert({
    tenant_id: session.tenant.id,
    code: parsed.data.code,
    label: parsed.data.label,
    color: parsed.data.color,
    icon: parsed.data.icon || null,
    description: parsed.data.description || null,
    type: parsed.data.type,
    position: nextPosition,
    kind: "custom",
  });
  if (error) {
    if (error.code === "23505") {
      return { errors: { code: ["Ce code est déjà utilisé"] } };
    }
    return { errors: { _form: [error.message] } };
  }

  await logTenantAudit(admin, session, "tenant.status.create", {
    code: parsed.data.code,
    label: parsed.data.label,
    type: parsed.data.type,
  });

  const { data: created } = await admin
    .from("parcel_statuses")
    .select("id")
    .eq("tenant_id", session.tenant.id)
    .eq("code", parsed.data.code)
    .maybeSingle();

  if (created?.id) {
    autoTranslateLabel(parsed.data.label).then((translations) => {
      if (Object.keys(translations).length > 0) {
        updateStatusLabelTranslations(
          session.tenant.id,
          created.id as string,
          translations as Record<string, string>,
        ).catch(() => {});
      }
    }).catch(() => {});
  }

  revalidatePath(`/${subdomain}/admin/statuts`);
  return { ok: true };
}

export async function updateStatusAction(
  _prev: StatusFormState | undefined,
  formData: FormData,
): Promise<StatusFormState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = UpdateStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as StatusFormState["errors"] };
  }

  const admin = createSupabaseAdmin();

  const { data: target } = await admin
    .from("parcel_statuses")
    .select("system_code, type")
    .eq("tenant_id", session.tenant.id)
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!target) return { errors: { _form: ["Statut introuvable"] } };

  // Statut système : on autorise le rename du label/couleur/icône mais on
  // verrouille code et type pour préserver le contrat système.
  const isSystem = (target.system_code as string | null) != null;

  if (parsed.data.type === "initial") {
    const { data: existingInitial } = await admin
      .from("parcel_statuses")
      .select("id")
      .eq("tenant_id", session.tenant.id)
      .eq("type", "initial")
      .neq("id", parsed.data.id);
    if ((existingInitial ?? []).length > 0) {
      return {
        errors: {
          type: ["Un autre statut initial existe déjà"],
        },
      };
    }
  }

  const update: Record<string, unknown> = {
    label: parsed.data.label,
    color: parsed.data.color,
    icon: parsed.data.icon || null,
    description: parsed.data.description || null,
  };
  if (!isSystem) {
    update.code = parsed.data.code;
    update.type = parsed.data.type;
  }

  const { error } = await admin
    .from("parcel_statuses")
    .update(update)
    .eq("tenant_id", session.tenant.id)
    .eq("id", parsed.data.id);

  if (error) {
    if (error.code === "23505") {
      return { errors: { code: ["Ce code est déjà utilisé"] } };
    }
    return { errors: { _form: [error.message] } };
  }

  await logTenantAudit(admin, session, "tenant.status.update", {
    id: parsed.data.id,
    code: parsed.data.code,
  });

  autoTranslateLabel(parsed.data.label).then((translations) => {
    if (Object.keys(translations).length > 0) {
      updateStatusLabelTranslations(
        session.tenant.id,
        parsed.data.id,
        translations as Record<string, string>,
      ).catch(() => {});
    }
  }).catch(() => {});

  revalidatePath(`/${subdomain}/admin/statuts`);
  return { ok: true };
}

export async function deleteStatusAction(formData: FormData): Promise<void> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const id = String(formData.get("id") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const admin = createSupabaseAdmin();

  const { data: target } = await admin
    .from("parcel_statuses")
    .select("system_code")
    .eq("tenant_id", session.tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (!target) throw new Error("Statut introuvable");
  if ((target.system_code as string | null) != null) {
    throw new Error("Statut système — non supprimable");
  }

  const { count: total } = await admin
    .from("parcel_statuses")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenant.id);

  if ((total ?? 0) <= MIN_STATUSES) {
    throw new Error(
      `Au moins ${MIN_STATUSES} statuts doivent rester actifs`,
    );
  }

  const { count: usage } = await admin
    .from("parcels")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenant.id)
    .eq("status_id", id);

  if ((usage ?? 0) > 0) {
    throw new Error(
      `Statut utilisé par ${usage} colis. Réaffectez-les avant suppression.`,
    );
  }

  const { error } = await admin
    .from("parcel_statuses")
    .delete()
    .eq("tenant_id", session.tenant.id)
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logTenantAudit(admin, session, "tenant.status.delete", { id });

  revalidatePath(`/${subdomain}/admin/statuts`);
}

export async function reorderStatusesAction(formData: FormData): Promise<void> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const orderRaw = String(formData.get("order") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const ids = orderRaw.split(",").filter(Boolean);
  if (ids.length === 0) return;

  const admin = createSupabaseAdmin();
  for (let i = 0; i < ids.length; i++) {
    await admin
      .from("parcel_statuses")
      .update({ position: (i + 1) * 10 })
      .eq("tenant_id", session.tenant.id)
      .eq("id", ids[i]);
  }

  await logTenantAudit(admin, session, "tenant.status.reorder", {
    order: ids,
  });

  revalidatePath(`/${subdomain}/admin/statuts`);
}
