import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60;

/**
 * Vérifie la signature Standard Webhooks d'une requête (utilisé par le Send
 * Email Hook Supabase). Le secret a la forme `v1,whsec_<base64>` ; les octets
 * de la clé HMAC sont le décodage base64 de la partie après `whsec_`.
 *
 * Contenu signé : `${webhook-id}.${webhook-timestamp}.${body}`
 * Header `webhook-signature` : liste d'entrées `v1,<sig>` séparées par espace.
 */
export function verifyStandardWebhook(args: {
  secret: string;
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  body: string;
  nowSeconds: number;
}): boolean {
  const { secret, id, timestamp, signatureHeader, body, nowSeconds } = args;
  if (!id || !timestamp || !signatureHeader) return false;

  // Anti-rejeu : on refuse un timestamp trop ancien / trop futur.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) {
    return false;
  }

  const base64Secret = secret.replace(/^v1,whsec_/, "").replace(/^whsec_/, "");
  let key: Buffer;
  try {
    key = Buffer.from(base64Secret, "base64");
  } catch {
    return false;
  }
  if (key.length === 0) return false;

  const signed = `${id}.${timestamp}.${body}`;
  const expected = createHmac("sha256", key).update(signed).digest("base64");
  const expectedBuf = Buffer.from(expected);

  return signatureHeader.split(" ").some((token) => {
    const comma = token.indexOf(",");
    const sig = comma >= 0 ? token.slice(comma + 1) : token;
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  });
}
