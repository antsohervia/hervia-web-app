import "server-only";
import { env, isProduction } from "@/lib/env";
import { getMailer, getMailerFrom } from "@/lib/email/client";
import {
  renderParcelStatusChangedEmail,
  type StatusInfo,
} from "@/lib/email/templates/parcel-status-changed";
import { buildUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isChannelEnabled } from "../repo";
import type {
  ChannelSendResult,
  NotificationChannel,
  NotificationContext,
} from "../types";

export const emailChannel: NotificationChannel = {
  id: "email",

  async isEnabledFor(ctx, admin) {
    if (!ctx.client.email) return false;
    if (ctx.client.status !== "active") return false;
    return isChannelEnabled(
      admin,
      ctx.client.id,
      "email",
      ctx.notification.event_type,
    );
  },

  async send(ctx) {
    if (ctx.notification.event_type === "parcel.status_changed") {
      return sendParcelStatusChanged(ctx);
    }
    return {
      ok: false,
      error: `email channel ne supporte pas encore ${ctx.notification.event_type}`,
      retryable: false,
    };
  },
};

async function sendParcelStatusChanged(
  ctx: NotificationContext,
): Promise<ChannelSendResult> {
  const mailer = getMailer();
  const from = getMailerFrom();
  if (!mailer || !from) {
    return { ok: false, error: "SMTP non configuré", retryable: true };
  }
  if (!ctx.client.email) {
    return { ok: false, error: "client sans email", retryable: false };
  }

  const data = ctx.notification.data as {
    parcel_id: string;
    parcel_reference: string;
    status_id: string;
    status_label: string;
    status_color: string;
    status_type: StatusInfo["type"];
    comment: string | null;
    occurred_at: string;
  };

  // Charge la liste des statuts du tenant pour la barre de progression
  const sb = createSupabaseAdmin();
  const { data: statuses } = await sb
    .from("parcel_statuses")
    .select("id, label, color, type, position")
    .eq("tenant_id", ctx.tenant.id)
    .order("position", { ascending: true });

  const allStatuses: StatusInfo[] = (statuses ?? []).map((s) => ({
    label: s.label as string,
    color: s.color as string,
    type: s.type as StatusInfo["type"],
    position: s.position as number,
  }));

  const host = isProduction() ? env.appDomain : env.devHost;
  const origin = `${isProduction() ? "https" : "http"}://${ctx.tenant.subdomain}.${host}`;
  const unsubscribeUrl = `${origin}/notifications/unsubscribe?token=${buildUnsubscribeToken(ctx.client.id)}`;

  const email = renderParcelStatusChangedEmail({
    tenantName: ctx.tenant.name,
    tenantLogoUrl: ctx.tenant.logo_url,
    tenantPrimaryColor: ctx.tenant.primary_color,
    tenantSubdomain: ctx.tenant.subdomain,
    parcelReference: data.parcel_reference,
    parcelId: data.parcel_id,
    newStatus: {
      label: data.status_label,
      color: data.status_color,
      type: data.status_type,
      position: 0, // reconstitué via allStatuses pour la progress bar
    },
    comment: data.comment,
    allStatuses,
    occurredAt: new Date(data.occurred_at),
    unsubscribeUrl,
    supportEmail: env.supportEmail,
  });

  try {
    const info = await mailer.sendMail({
      from,
      to: ctx.client.email,
      replyTo: env.supportEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      list: { unsubscribe: { url: unsubscribeUrl, comment: "Désinscription" } },
    });
    return { ok: true, providerMessageId: info.messageId ?? null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      retryable: true,
    };
  }
}
