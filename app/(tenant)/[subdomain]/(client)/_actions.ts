"use server";

import { revalidatePath } from "next/cache";
import { requireClientSession } from "@/lib/auth/client-dal";
import {
  AddParcelByTrackingSchema,
  type AddParcelByTrackingState,
} from "@/lib/validations/parcel";
import { getTransportMode } from "@/lib/transport-modes/repo";
import {
  createClientInitiatedParcel,
  findTenantParcelByReference,
  getPendingClientResponseStatusId,
  linkParcelToClient,
} from "@/lib/clients/repo";
import { insertParcelEvent } from "@/lib/parcels/repo";

export async function addParcelByTrackingAction(
  _prev: AddParcelByTrackingState | undefined,
  formData: FormData,
): Promise<AddParcelByTrackingState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireClientSession(subdomain);

  const parsed = AddParcelByTrackingSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as AddParcelByTrackingState["errors"],
    };
  }
  const { reference, transportModeId } = parsed.data;

  const mode = await getTransportMode(session.tenant.id, transportModeId);
  if (!mode) {
    return {
      errors: { transportModeId: ["Mode de transport invalide"] },
    };
  }

  const existing = await findTenantParcelByReference(
    session.tenant.id,
    reference,
  );

  if (!existing) {
    let pendingStatusId: string;
    try {
      pendingStatusId = await getPendingClientResponseStatusId(
        session.tenant.id,
      );
    } catch (e) {
      return {
        errors: {
          _form: [e instanceof Error ? e.message : "Statut système absent"],
        },
      };
    }

    let parcelId: string;
    try {
      const created = await createClientInitiatedParcel({
        tenantId: session.tenant.id,
        clientId: session.clientId,
        reference,
        transportModeId,
        pendingStatusId,
      });
      parcelId = created.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de l'enregistrement";
      if (msg.includes("duplicate") || msg.includes("23505")) {
        return {
          errors: { _form: ["Ce numéro de tracking existe déjà"] },
        };
      }
      return { errors: { _form: [msg] } };
    }

    await insertParcelEvent({
      tenantId: session.tenant.id,
      parcelId,
      statusId: pendingStatusId,
      comment: "Création par le client",
      actorId: session.userId,
      actorEmail: session.email,
    });

    revalidatePath(`/${subdomain}`);
    return { ok: true, parcelId, outcome: "created" };
  }

  if (existing.client_id && existing.client_id === session.clientId) {
    revalidatePath(`/${subdomain}`);
    return { ok: true, parcelId: existing.id, outcome: "already_linked" };
  }

  if (existing.client_id && existing.client_id !== session.clientId) {
    return {
      errors: {
        _form: [
          "Numéro de tracking déjà associé à un autre client. Contactez votre transitaire.",
        ],
      },
    };
  }

  await linkParcelToClient(existing.id, session.clientId, {
    transportModeIdIfNull: existing.transport_mode_id
      ? undefined
      : transportModeId,
  });
  await insertParcelEvent({
    tenantId: session.tenant.id,
    parcelId: existing.id,
    statusId: existing.status_id,
    comment: "Colis lié au client",
    actorId: session.userId,
    actorEmail: session.email,
  });

  revalidatePath(`/${subdomain}`);
  return { ok: true, parcelId: existing.id, outcome: "linked" };
}
