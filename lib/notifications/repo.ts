import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  NotificationChannelId,
  NotificationContext,
  NotificationEventType,
  NotificationRecord,
} from "./types";

/**
 * Charge la notification + tenant + client en un seul aller-retour.
 * Retourne null si la notification, le tenant ou le client n'existe plus
 * (ex. suppression entre l'insert et le dispatch).
 */
export async function loadNotificationContext(
  admin: SupabaseClient,
  notificationId: string,
): Promise<NotificationContext | null> {
  const { data: notif } = await admin
    .from("notifications")
    .select(
      "id, tenant_id, recipient_client_id, event_type, subject_type, subject_id, title, body, link_url, data, created_at",
    )
    .eq("id", notificationId)
    .maybeSingle();
  if (!notif) return null;

  const [{ data: tenant }, { data: client }] = await Promise.all([
    admin
      .from("tenants")
      .select("id, name, subdomain, logo_url, primary_color")
      .eq("id", notif.tenant_id)
      .maybeSingle(),
    admin
      .from("clients")
      .select("id, full_name, email, user_id, status")
      .eq("id", notif.recipient_client_id)
      .maybeSingle(),
  ]);
  if (!tenant || !client) return null;

  return {
    notification: notif as NotificationRecord,
    tenant: {
      id: tenant.id as string,
      name: tenant.name as string,
      subdomain: tenant.subdomain as string,
      logo_url: (tenant.logo_url as string | null) ?? null,
      primary_color: tenant.primary_color as string,
    },
    client: {
      id: client.id as string,
      full_name: client.full_name as string,
      email: (client.email as string | null) ?? null,
      user_id: (client.user_id as string | null) ?? null,
      status: client.status as string,
    },
  };
}

/**
 * Lit la préférence (client, channel, event_type) en cascade :
 * 1. ligne explicite (client_id, channel, event_type)
 * 2. fallback (client_id, channel, '*')
 * 3. défaut = true (opt-out)
 */
export async function isChannelEnabled(
  admin: SupabaseClient,
  clientId: string,
  channel: NotificationChannelId,
  eventType: NotificationEventType,
): Promise<boolean> {
  const { data: rows } = await admin
    .from("notification_preferences")
    .select("event_type, enabled")
    .eq("client_id", clientId)
    .eq("channel", channel)
    .in("event_type", [eventType, "*"]);

  if (!rows || rows.length === 0) return true;
  const exact = rows.find((r) => r.event_type === eventType);
  if (exact) return Boolean(exact.enabled);
  const wildcard = rows.find((r) => r.event_type === "*");
  if (wildcard) return Boolean(wildcard.enabled);
  return true;
}

/**
 * Crée la ligne d'outbox pour un canal donné. Idempotent grâce à
 * l'unique (notification_id, channel) — si la ligne existe déjà, on
 * récupère son id sans la dupliquer.
 *
 * Retourne l'id outbox ou null si l'insertion a échoué pour une raison
 * autre qu'un conflit (ex. notification supprimée).
 */
export async function ensureOutboxRow(
  admin: SupabaseClient,
  notificationId: string,
  channel: NotificationChannelId,
): Promise<{ id: string; created: boolean } | null> {
  const { data: existing } = await admin
    .from("notification_outbox")
    .select("id")
    .eq("notification_id", notificationId)
    .eq("channel", channel)
    .maybeSingle();
  if (existing) return { id: existing.id as string, created: false };

  const { data: inserted, error } = await admin
    .from("notification_outbox")
    .insert({
      notification_id: notificationId,
      channel,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !inserted) return null;
  return { id: inserted.id as string, created: true };
}

/**
 * Backoff selon US-C4.1 : 5min, 30min, 2h pour les 3 tentatives.
 * Renvoie la date de la prochaine tentative à partir de `attempts`
 * (0 = 1ère tentative; 1 = 2ème tentative; etc.).
 */
const RETRY_DELAYS_MS = [5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];

export function nextAttemptDate(attempts: number): Date {
  const idx = Math.min(attempts, RETRY_DELAYS_MS.length - 1);
  return new Date(Date.now() + RETRY_DELAYS_MS[idx]);
}

/**
 * Met à jour la ligne d'outbox après une tentative de livraison.
 */
export async function markOutboxResult(
  admin: SupabaseClient,
  outboxId: string,
  result:
    | { ok: true; providerMessageId?: string | null }
    | { ok: false; error: string; retryable: boolean; attempts: number; maxAttempts: number },
): Promise<void> {
  if (result.ok) {
    await admin
      .from("notification_outbox")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: result.providerMessageId ?? null,
        last_error: null,
      })
      .eq("id", outboxId);
    return;
  }

  const giveUp = !result.retryable || result.attempts + 1 >= result.maxAttempts;
  await admin
    .from("notification_outbox")
    .update({
      status: giveUp ? "failed" : "retry",
      attempts: result.attempts + 1,
      next_attempt_at: giveUp ? null : nextAttemptDate(result.attempts).toISOString(),
      last_error: result.error.slice(0, 1000),
    })
    .eq("id", outboxId);
}
