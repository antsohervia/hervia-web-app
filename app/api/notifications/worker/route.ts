import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processOutboxBatch } from "@/lib/notifications/dispatcher";

export const runtime = "nodejs";

function verifySecret(provided: string | null): boolean {
  const expected = process.env.NOTIFICATIONS_SHARED_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * POST: traite un batch d'outbox prêtes à retry.
 * Appelé périodiquement par un cron (Supabase + pg_net ou Vercel Cron).
 */
export async function POST(request: Request) {
  if (!verifySecret(request.headers.get("x-notify-secret"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  try {
    const summary = await processOutboxBatch(limit);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[notifications/worker] erreur", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "worker failed" }, { status: 500 });
  }
}
