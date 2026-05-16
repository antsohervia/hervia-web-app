import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

export const runtime = "nodejs";

function verifySecret(provided: string | null): boolean {
  const expected = process.env.NOTIFICATIONS_SHARED_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!verifySecret(request.headers.get("x-notify-secret"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { notification_id?: string }
    | null;
  const notificationId = body?.notification_id;
  if (!notificationId || typeof notificationId !== "string") {
    return NextResponse.json({ error: "notification_id requis" }, { status: 400 });
  }

  try {
    const summary = await dispatchNotification(notificationId);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[notifications/dispatch] erreur", {
      notificationId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "dispatch failed" }, { status: 500 });
  }
}
