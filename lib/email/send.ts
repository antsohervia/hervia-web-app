import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { env, isProduction } from "@/lib/env";
import { getMailer, getMailerFrom } from "./client";
import {
  renderParcelStatusChangedEmail,
  type StatusInfo,
} from "./templates/parcel-status-changed";
import { buildUnsubscribeToken } from "./unsubscribe-token";

type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
};

/**
 * Envoie l'email de notification de changement de statut au client
 * propriétaire du colis. Fire-and-forget côté appelant : log mais
 * ne throw pas (US-C4.1 : la mise à jour métier ne doit pas être bloquée).
 *
 * Retourne true si envoyé, false si skip (préférence ou config absente).
 */
export async function sendParcelStatusChangeEmail(args: {
  parcelId: string;
  tenant: Tenant;
  newStatusId: string;
  occurredAt: Date;
  comment: string | null;
}): Promise<boolean> {
  try {
    const mailer = getMailer();
    const from = getMailerFrom();
    if (!mailer || !from) {
      console.warn(
        "[email] SMTP non configuré, notification skipée pour parcel",
        args.parcelId,
      );
      return false;
    }

    const admin = createSupabaseAdmin();

    const { data: parcel } = await admin
      .from("parcels")
      .select("id, reference, client_id")
      .eq("id", args.parcelId)
      .maybeSingle();
    if (!parcel || !parcel.client_id) return false;

    const { data: client } = await admin
      .from("clients")
      .select(
        "id, full_name, email, status, email_notifications_enabled",
      )
      .eq("id", parcel.client_id)
      .maybeSingle();
    if (!client || !client.email) return false;
    if (client.status !== "active") return false;
    if (!client.email_notifications_enabled) return false;

    const { data: statuses } = await admin
      .from("parcel_statuses")
      .select("id, label, color, type, position")
      .eq("tenant_id", args.tenant.id)
      .order("position", { ascending: true });

    const allStatuses: StatusInfo[] = (statuses ?? []).map((s) => ({
      label: s.label as string,
      color: s.color as string,
      type: s.type as StatusInfo["type"],
      position: s.position as number,
    }));

    const newStatus = (statuses ?? []).find(
      (s) => s.id === args.newStatusId,
    );
    if (!newStatus) return false;

    const host = isProduction() ? env.appDomain : env.devHost;
    const origin = `${isProduction() ? "https" : "http"}://${args.tenant.subdomain}.${host}`;
    const unsubscribeUrl = `${origin}/notifications/unsubscribe?token=${buildUnsubscribeToken(client.id as string)}`;

    const email = renderParcelStatusChangedEmail({
      tenantName: args.tenant.name,
      tenantLogoUrl: args.tenant.logo_url,
      tenantPrimaryColor: args.tenant.primary_color,
      tenantSubdomain: args.tenant.subdomain,
      parcelReference: parcel.reference as string,
      parcelId: parcel.id as string,
      newStatus: {
        label: newStatus.label as string,
        color: newStatus.color as string,
        type: newStatus.type as StatusInfo["type"],
        position: newStatus.position as number,
      },
      comment: args.comment,
      allStatuses,
      occurredAt: args.occurredAt,
      unsubscribeUrl,
      supportEmail: env.supportEmail,
    });

    await mailer.sendMail({
      from,
      to: client.email as string,
      replyTo: env.supportEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      list: {
        unsubscribe: { url: unsubscribeUrl, comment: "Désinscription" },
      },
    });

    return true;
  } catch (err) {
    console.error("[email] Échec envoi notification statut", {
      parcelId: args.parcelId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
