import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getUnsubscribeSecret } from "@/lib/env";

function sign(payload: string): string {
  return createHmac("sha256", getUnsubscribeSecret())
    .update(payload)
    .digest("base64url");
}

/**
 * Token de désinscription : `<clientId>.<sig>`
 * Pas d'expiration (le client peut s'inscrire/désinscrire à tout moment ;
 * on bascule simplement la préférence boolean côté DB).
 */
export function buildUnsubscribeToken(clientId: string): string {
  const sig = sign(clientId);
  return `${clientId}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const idx = token.indexOf(".");
  if (idx <= 0) return null;
  const clientId = token.slice(0, idx);
  const provided = token.slice(idx + 1);
  const expected = sign(clientId);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? clientId : null;
}
