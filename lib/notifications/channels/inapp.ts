import "server-only";
import { isChannelEnabled } from "../repo";
import type { NotificationChannel } from "../types";

/**
 * Canal in-app. La notification row existe déjà côté DB et est exposée
 * via Supabase Realtime — `send()` est donc un no-op qui marque l'outbox
 * comme livré (utile pour le tableau de bord d'observabilité).
 *
 * Particularité : le canal in-app est **toujours actif** pour un client
 * connecté (status=active). Désactiver l'email n'éteint pas l'in-app
 * (les deux canaux sont indépendants, cf. US-C4.2).
 */
export const inappChannel: NotificationChannel = {
  id: "inapp",

  async isEnabledFor(ctx, admin) {
    if (ctx.client.status !== "active") return false;
    return isChannelEnabled(
      admin,
      ctx.client.id,
      "inapp",
      ctx.notification.event_type,
    );
  },

  async send() {
    return { ok: true };
  },
};
