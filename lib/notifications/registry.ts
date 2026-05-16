import "server-only";
import { emailChannel } from "./channels/email";
import { inappChannel } from "./channels/inapp";
import type { NotificationChannel, NotificationChannelId } from "./types";

/**
 * Registre des canaux actifs. Ajouter un canal = importer son module
 * et l'ajouter ici. C'est le seul point de couplage entre les canaux
 * et le dispatcher.
 */
export const channels: readonly NotificationChannel[] = [
  inappChannel,
  emailChannel,
];

export function getChannel(id: NotificationChannelId): NotificationChannel | null {
  return channels.find((c) => c.id === id) ?? null;
}
