import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { channels, getChannel } from "./registry";
import {
  ensureOutboxRow,
  loadNotificationContext,
  markOutboxResult,
} from "./repo";
import type { NotificationChannel, NotificationContext } from "./types";

export type DispatchSummary = {
  notificationId: string;
  enqueued: { channel: string; outboxId: string; created: boolean }[];
  skipped: { channel: string; reason: string }[];
  sent: { channel: string; outboxId: string; ok: boolean; error?: string }[];
};

/**
 * Dispatch d'une notification existante vers tous les canaux activés.
 * Étapes :
 *  1. Charge le contexte (tenant + client)
 *  2. Pour chaque canal: si `isEnabledFor` → insère/récupère sa ligne outbox
 *  3. Pour chaque ligne `pending` nouvellement créée: appelle `channel.send()`
 *  4. Met à jour l'outbox avec le résultat
 *
 * Idempotent par construction (unique constraint sur outbox).
 */
export async function dispatchNotification(
  notificationId: string,
  admin: SupabaseClient = createSupabaseAdmin(),
): Promise<DispatchSummary> {
  const summary: DispatchSummary = {
    notificationId,
    enqueued: [],
    skipped: [],
    sent: [],
  };

  const ctx = await loadNotificationContext(admin, notificationId);
  if (!ctx) {
    summary.skipped.push({ channel: "*", reason: "context introuvable" });
    return summary;
  }

  for (const channel of channels) {
    let enabled: boolean;
    try {
      enabled = await channel.isEnabledFor(ctx, admin);
    } catch (err) {
      summary.skipped.push({
        channel: channel.id,
        reason: `isEnabledFor a throw: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }
    if (!enabled) {
      summary.skipped.push({ channel: channel.id, reason: "désactivé" });
      continue;
    }

    const row = await ensureOutboxRow(admin, ctx.notification.id, channel.id);
    if (!row) {
      summary.skipped.push({ channel: channel.id, reason: "outbox insert échec" });
      continue;
    }
    summary.enqueued.push({ channel: channel.id, outboxId: row.id, created: row.created });

    // On ne ré-envoie que les lignes qu'on vient de créer (sinon le
    // worker s'en charge). Évite les doubles envois en cas de retry
    // du dispatch.
    if (!row.created) continue;

    await attemptSend(admin, ctx, channel, row.id, 0, summary);
  }

  return summary;
}

/**
 * Tente l'envoi via un canal et met à jour la ligne d'outbox.
 * Utilisé à la fois par le dispatcher (1ère tentative) et le worker
 * (retries successifs).
 */
export async function attemptSend(
  admin: SupabaseClient,
  ctx: NotificationContext,
  channel: NotificationChannel,
  outboxId: string,
  currentAttempts: number,
  summary?: DispatchSummary,
  maxAttempts = 3,
): Promise<void> {
  let result: Awaited<ReturnType<NotificationChannel["send"]>>;
  try {
    result = await channel.send(ctx);
  } catch (err) {
    result = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      retryable: true,
    };
  }

  if (result.ok) {
    await markOutboxResult(admin, outboxId, {
      ok: true,
      providerMessageId: result.providerMessageId ?? null,
    });
    summary?.sent.push({ channel: channel.id, outboxId, ok: true });
    return;
  }

  await markOutboxResult(admin, outboxId, {
    ok: false,
    error: result.error,
    retryable: result.retryable,
    attempts: currentAttempts,
    maxAttempts,
  });
  summary?.sent.push({ channel: channel.id, outboxId, ok: false, error: result.error });
}

/**
 * Worker : traite jusqu'à `limit` lignes d'outbox en attente de retry.
 * Appelé périodiquement par un cron (Supabase cron + pg_net ou Vercel Cron).
 */
export async function processOutboxBatch(
  limit = 50,
  admin: SupabaseClient = createSupabaseAdmin(),
): Promise<{ processed: number; errors: number }> {
  const { data: rows } = await admin
    .from("notification_outbox")
    .select("id, notification_id, channel, attempts, max_attempts")
    .in("status", ["pending", "retry"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  if (!rows || rows.length === 0) return { processed: 0, errors: 0 };

  let processed = 0;
  let errors = 0;

  for (const row of rows) {
    const channel = getChannel(row.channel as never);
    if (!channel) {
      await admin
        .from("notification_outbox")
        .update({
          status: "failed",
          last_error: `canal inconnu: ${row.channel}`,
        })
        .eq("id", row.id);
      errors++;
      continue;
    }

    const ctx = await loadNotificationContext(admin, row.notification_id as string);
    if (!ctx) {
      await admin
        .from("notification_outbox")
        .update({ status: "failed", last_error: "notification introuvable" })
        .eq("id", row.id);
      errors++;
      continue;
    }

    await attemptSend(
      admin,
      ctx,
      channel,
      row.id as string,
      row.attempts as number,
      undefined,
      row.max_attempts as number,
    );
    processed++;
  }

  return { processed, errors };
}
