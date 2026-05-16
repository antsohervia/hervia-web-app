"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertNotImpersonatingTenant,
  requireTenantSession,
} from "@/lib/auth/tenant-dal";
import { logTenantAudit } from "@/lib/parcels/audit";
import {
  ChangeStatusSchema,
  CreateParcelSchema,
  UpdateParcelSchema,
  type ChangeStatusState,
  type CreateParcelState,
  type ScanResult,
  type UpdateParcelState,
} from "@/lib/validations/parcel";

export async function createParcelAction(
  _prev: CreateParcelState | undefined,
  formData: FormData,
): Promise<CreateParcelState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantSession(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = CreateParcelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as CreateParcelState["errors"] };
  }
  const data = parsed.data;

  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("parcels")
    .select("id")
    .eq("tenant_id", session.tenant.id)
    .eq("reference", data.reference)
    .maybeSingle();
  if (existing) {
    return { errors: { reference: ["Référence déjà utilisée pour cet espace"] } };
  }

  const { data: status } = await admin
    .from("parcel_statuses")
    .select("id")
    .eq("tenant_id", session.tenant.id)
    .eq("id", data.statusId)
    .maybeSingle();
  if (!status) return { errors: { statusId: ["Statut introuvable"] } };

  if (data.transportModeId) {
    const { data: mode } = await admin
      .from("transport_modes")
      .select("id")
      .eq("tenant_id", session.tenant.id)
      .eq("id", data.transportModeId)
      .maybeSingle();
    if (!mode) {
      return { errors: { transportModeId: ["Mode de transport introuvable"] } };
    }
  }

  const { data: parcel, error } = await admin
    .from("parcels")
    .insert({
      tenant_id: session.tenant.id,
      reference: data.reference,
      status_id: data.statusId,
      transport_mode_id: data.transportModeId,
      description: data.description,
      weight_kg: data.weightKg,
      volume_m3: data.volumeM3,
      estimated_price: data.estimatedPrice,
      currency: data.currency ?? session.tenant.default_currency,
      origin_country: data.originCountry,
      destination_country: data.destinationCountry,
      shipped_at: new Date(data.shippedAt).toISOString(),
      estimated_delivery_at: data.estimatedDeliveryAt,
    })
    .select("id")
    .single();
  if (error || !parcel) {
    return { errors: { _form: [error?.message ?? "Échec de la création"] } };
  }

  await admin.from("parcel_events").insert({
    tenant_id: session.tenant.id,
    parcel_id: parcel.id,
    status_id: data.statusId,
    comment: "Création du colis",
    occurred_at: new Date().toISOString(),
    actor_id: session.userId === "impersonation" ? null : session.userId,
    actor_email: session.email,
  });

  await logTenantAudit(admin, session, "tenant.parcel.create", {
    parcel_id: parcel.id,
    reference: data.reference,
    transport_mode_id: data.transportModeId,
  });

  revalidatePath(`/${subdomain}/admin/colis`);
  redirect(`/admin/colis/${parcel.id}`);
}

export async function updateParcelAction(
  _prev: UpdateParcelState | undefined,
  formData: FormData,
): Promise<UpdateParcelState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantSession(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = UpdateParcelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as UpdateParcelState["errors"] };
  }
  const data = parsed.data;

  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("parcels")
    .select("id")
    .eq("tenant_id", session.tenant.id)
    .eq("id", data.parcelId)
    .maybeSingle();
  if (!existing) return { errors: { _form: ["Colis introuvable"] } };

  if (data.transportModeId) {
    const { data: mode } = await admin
      .from("transport_modes")
      .select("id")
      .eq("tenant_id", session.tenant.id)
      .eq("id", data.transportModeId)
      .maybeSingle();
    if (!mode) {
      return { errors: { transportModeId: ["Mode de transport introuvable"] } };
    }
  }

  const { error } = await admin
    .from("parcels")
    .update({
      transport_mode_id: data.transportModeId,
      description: data.description,
      weight_kg: data.weightKg,
      volume_m3: data.volumeM3,
      estimated_price: data.estimatedPrice,
      currency: data.currency,
      origin_country: data.originCountry,
      destination_country: data.destinationCountry,
      shipped_at: data.shippedAt
        ? new Date(data.shippedAt).toISOString()
        : null,
      estimated_delivery_at: data.estimatedDeliveryAt,
    })
    .eq("tenant_id", session.tenant.id)
    .eq("id", data.parcelId);
  if (error) return { errors: { _form: [error.message] } };

  await logTenantAudit(admin, session, "tenant.parcel.update", {
    parcel_id: data.parcelId,
  });

  revalidatePath(`/${subdomain}/admin/colis`);
  revalidatePath(`/${subdomain}/admin/colis/${data.parcelId}`);
  return { ok: true };
}

export async function changeParcelStatusAction(
  _prev: ChangeStatusState | undefined,
  formData: FormData,
): Promise<ChangeStatusState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantSession(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = ChangeStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as ChangeStatusState["errors"] };
  }
  const data = parsed.data;

  const admin = createSupabaseAdmin();

  const { data: parcel } = await admin
    .from("parcels")
    .select("id, status_id, parcel_statuses(type)")
    .eq("tenant_id", session.tenant.id)
    .eq("id", data.parcelId)
    .maybeSingle();
  if (!parcel) return { errors: { _form: ["Colis introuvable"] } };

  const ps = parcel.parcel_statuses;
  const currentStatus = (Array.isArray(ps) ? ps[0] : ps) as
    | { type: string }
    | null
    | undefined;
  const isFinal = currentStatus?.type === "final";
  if (isFinal && data.forceFinalReopen !== "on") {
    return {
      errors: {
        _form: [
          "Ce colis est clôturé. Cochez la case pour confirmer la réouverture.",
        ],
      },
    };
  }
  if (isFinal && session.role !== "entreprise_admin") {
    return {
      errors: {
        _form: ["Seul un administrateur peut rouvrir un colis clôturé"],
      },
    };
  }

  const { data: nextStatus } = await admin
    .from("parcel_statuses")
    .select("id, label, type")
    .eq("tenant_id", session.tenant.id)
    .eq("id", data.statusId)
    .maybeSingle();
  if (!nextStatus) return { errors: { statusId: ["Statut introuvable"] } };

  const occurredAt = data.occurredAt
    ? new Date(data.occurredAt).toISOString()
    : new Date().toISOString();

  const { error: updErr } = await admin
    .from("parcels")
    .update({ status_id: data.statusId })
    .eq("tenant_id", session.tenant.id)
    .eq("id", data.parcelId);
  if (updErr) return { errors: { _form: [updErr.message] } };

  await admin.from("parcel_events").insert({
    tenant_id: session.tenant.id,
    parcel_id: data.parcelId,
    status_id: data.statusId,
    comment: data.comment,
    occurred_at: occurredAt,
    actor_id: session.userId === "impersonation" ? null : session.userId,
    actor_email: session.email,
  });

  await logTenantAudit(admin, session, "tenant.parcel.status_change", {
    parcel_id: data.parcelId,
    status_id: data.statusId,
    reopen: isFinal,
  });

  // Notifications (US-C4) : déclenchées par le trigger Postgres
  // AFTER INSERT ON parcel_events → /api/notifications/dispatch (ADR-0001).

  revalidatePath(`/${subdomain}/admin/colis`);
  revalidatePath(`/${subdomain}/admin/colis/${data.parcelId}`);
  return { ok: true };
}

export async function scanStatusAction(
  reference: string,
  statusId: string,
  transportModeId: string | null,
  subdomain: string,
): Promise<ScanResult> {
  try {
    const session = await requireTenantSession(subdomain);
    assertNotImpersonatingTenant(session);

    const admin = createSupabaseAdmin();

    const [{ data: parcel }, { data: nextStatus }] = await Promise.all([
      admin
        .from("parcels")
        .select("id, reference, status_id, parcel_statuses(type), clients(full_name)")
        .eq("tenant_id", session.tenant.id)
        .eq("reference", reference)
        .maybeSingle(),
      admin
        .from("parcel_statuses")
        .select("id")
        .eq("tenant_id", session.tenant.id)
        .eq("id", statusId)
        .maybeSingle(),
    ]);

    if (!nextStatus) {
      return { ok: false, reference, errorType: "error", errorMessage: "Statut cible introuvable" };
    }

    const occurredAt = new Date().toISOString();

    // Colis introuvable → création automatique avec le statut du lot
    if (!parcel) {
      const { data: created, error: createErr } = await admin
        .from("parcels")
        .insert({
          tenant_id: session.tenant.id,
          reference,
          status_id: statusId,
          transport_mode_id: transportModeId ?? null,
          shipped_at: occurredAt,
        })
        .select("id")
        .single();

      if (createErr || !created) {
        return { ok: false, reference, errorType: "error", errorMessage: createErr?.message ?? "Échec de la création" };
      }

      await admin.from("parcel_events").insert({
        tenant_id: session.tenant.id,
        parcel_id: created.id,
        status_id: statusId,
        comment: "Créé par scan en lot",
        occurred_at: occurredAt,
        actor_id: session.userId === "impersonation" ? null : session.userId,
        actor_email: session.email,
      });

      void logTenantAudit(admin, session, "tenant.parcel.create", {
        parcel_id: created.id,
        reference,
        scan: true,
      });

      revalidatePath(`/${subdomain}/admin/colis`);
      return { ok: true, reference, clientName: null, created: true };
    }

    // Colis trouvé → changement de statut
    if (parcel.status_id === statusId) {
      return { ok: false, reference, errorType: "already_at_status" };
    }

    const ps = parcel.parcel_statuses;
    const currentStatus = (Array.isArray(ps) ? ps[0] : ps) as
      | { type: string }
      | null
      | undefined;
    if (currentStatus?.type === "final") {
      return { ok: false, reference, errorType: "is_final" };
    }

    const update: Record<string, unknown> = { status_id: statusId };
    if (transportModeId) update.transport_mode_id = transportModeId;

    const { error: updErr } = await admin
      .from("parcels")
      .update(update)
      .eq("tenant_id", session.tenant.id)
      .eq("id", parcel.id);
    if (updErr) {
      return { ok: false, reference, errorType: "error", errorMessage: updErr.message };
    }

    await admin.from("parcel_events").insert({
      tenant_id: session.tenant.id,
      parcel_id: parcel.id,
      status_id: statusId,
      comment: null,
      occurred_at: occurredAt,
      actor_id: session.userId === "impersonation" ? null : session.userId,
      actor_email: session.email,
    });

    void logTenantAudit(admin, session, "tenant.parcel.status_change", {
      parcel_id: parcel.id,
      status_id: statusId,
      scan: true,
    });

    // Notifications déclenchées par le trigger Postgres (ADR-0001).

    revalidatePath(`/${subdomain}/admin/colis`);

    const clientRaw = parcel.clients as
      | { full_name: string | null }
      | { full_name: string | null }[]
      | null;
    const clientName = Array.isArray(clientRaw)
      ? (clientRaw[0]?.full_name ?? null)
      : (clientRaw?.full_name ?? null);
    return { ok: true, reference, clientName };
  } catch (e) {
    // Re-throw Next.js redirect/notFound — they carry a `digest` field
    if (e != null && typeof e === "object" && "digest" in e) throw e;
    return { ok: false, reference, errorType: "error", errorMessage: "Erreur inattendue" };
  }
}
