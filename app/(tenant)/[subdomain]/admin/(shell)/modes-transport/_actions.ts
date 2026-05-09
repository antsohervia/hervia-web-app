"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertNotImpersonatingTenant,
  requireTenantAdmin,
} from "@/lib/auth/tenant-dal";
import { logTenantAudit } from "@/lib/parcels/audit";
import {
  CreateTransportModeSchema,
  UpdateTransportModeSchema,
  type TransportModeFormState,
} from "@/lib/validations/transport-mode";
import {
  createTransportMode,
  deleteTransportMode,
  reorderTransportModes,
  updateTransportMode,
} from "@/lib/transport-modes/repo";

export async function createTransportModeAction(
  _prev: TransportModeFormState | undefined,
  formData: FormData,
): Promise<TransportModeFormState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = CreateTransportModeSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as TransportModeFormState["errors"],
    };
  }

  try {
    await createTransportMode(session.tenant.id, parsed.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Échec de la création";
    if (msg.includes("duplicate") || msg.includes("23505")) {
      return { errors: { code: ["Ce code est déjà utilisé"] } };
    }
    return { errors: { _form: [msg] } };
  }

  const admin = createSupabaseAdmin();
  await logTenantAudit(admin, session, "tenant.transport_mode.create", {
    code: parsed.data.code,
    label: parsed.data.label,
  });

  revalidatePath(`/${subdomain}/admin/modes-transport`);
  return { ok: true };
}

export async function updateTransportModeAction(
  _prev: TransportModeFormState | undefined,
  formData: FormData,
): Promise<TransportModeFormState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = UpdateTransportModeSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as TransportModeFormState["errors"],
    };
  }

  try {
    await updateTransportMode(session.tenant.id, parsed.data.id, {
      code: parsed.data.code,
      label: parsed.data.label,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Échec de la mise à jour";
    if (msg.includes("duplicate") || msg.includes("23505")) {
      return { errors: { code: ["Ce code est déjà utilisé"] } };
    }
    return { errors: { _form: [msg] } };
  }

  const admin = createSupabaseAdmin();
  await logTenantAudit(admin, session, "tenant.transport_mode.update", {
    id: parsed.data.id,
    code: parsed.data.code,
  });

  revalidatePath(`/${subdomain}/admin/modes-transport`);
  return { ok: true };
}

export async function deleteTransportModeAction(
  formData: FormData,
): Promise<void> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const id = String(formData.get("id") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  await deleteTransportMode(session.tenant.id, id);

  const admin = createSupabaseAdmin();
  await logTenantAudit(admin, session, "tenant.transport_mode.delete", { id });

  revalidatePath(`/${subdomain}/admin/modes-transport`);
}

export async function reorderTransportModesAction(
  formData: FormData,
): Promise<void> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const orderRaw = String(formData.get("order") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const ids = orderRaw.split(",").filter(Boolean);
  if (ids.length === 0) return;

  await reorderTransportModes(session.tenant.id, ids);

  const admin = createSupabaseAdmin();
  await logTenantAudit(admin, session, "tenant.transport_mode.reorder", {
    order: ids,
  });

  revalidatePath(`/${subdomain}/admin/modes-transport`);
}
