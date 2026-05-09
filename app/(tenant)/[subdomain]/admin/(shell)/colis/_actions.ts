"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertNotImpersonatingTenant,
  requireTenantSession,
} from "@/lib/auth/tenant-dal";
import { logTenantAudit } from "@/lib/parcels/audit";
import { sendParcelStatusChangeEmail } from "@/lib/email/send";
import {
  ChangeStatusSchema,
  CreateParcelSchema,
  type ChangeStatusState,
  type CreateParcelState,
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

  if (data.clientId) {
    const { data: client } = await admin
      .from("clients")
      .select("id")
      .eq("tenant_id", session.tenant.id)
      .eq("id", data.clientId)
      .maybeSingle();
    if (!client) return { errors: { clientId: ["Client introuvable"] } };
  }

  const { data: parcel, error } = await admin
    .from("parcels")
    .insert({
      tenant_id: session.tenant.id,
      reference: data.reference,
      client_id: data.clientId,
      status_id: data.statusId,
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
    client_id: data.clientId,
  });

  revalidatePath(`/${subdomain}/admin/colis`);
  redirect(`/admin/colis/${parcel.id}`);
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

  // Notification email client (US-C4.1) — fire-and-forget : un échec
  // SMTP ne doit pas bloquer la mise à jour métier.
  await sendParcelStatusChangeEmail({
    parcelId: data.parcelId,
    tenant: {
      id: session.tenant.id,
      name: session.tenant.name,
      subdomain: session.tenant.subdomain,
      logo_url: session.tenant.logo_url,
      primary_color: session.tenant.primary_color,
    },
    newStatusId: data.statusId,
    occurredAt: new Date(occurredAt),
    comment: data.comment,
  });

  revalidatePath(`/${subdomain}/admin/colis`);
  revalidatePath(`/${subdomain}/admin/colis/${data.parcelId}`);
  return { ok: true };
}
