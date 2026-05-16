"use server";

import { requireClientSession } from "@/lib/auth/client-dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type ClientNotification = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
  subject_id: string | null;
};

const PAGE_SIZE = 20;

export async function listClientNotifications(
  subdomain: string,
  beforeCreatedAt?: string,
): Promise<{ items: ClientNotification[]; hasMore: boolean }> {
  const session = await requireClientSession(subdomain);
  const admin = createSupabaseAdmin();

  let q = admin
    .from("notifications")
    .select(
      "id, event_type, title, body, link_url, read_at, created_at, subject_id",
    )
    .eq("recipient_client_id", session.clientId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (beforeCreatedAt) {
    q = q.lt("created_at", beforeCreatedAt);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ClientNotification[];
  const hasMore = rows.length > PAGE_SIZE;
  return { items: rows.slice(0, PAGE_SIZE), hasMore };
}

export async function getClientNotificationsUnreadCount(
  subdomain: string,
): Promise<number> {
  const session = await requireClientSession(subdomain);
  const admin = createSupabaseAdmin();
  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_client_id", session.clientId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationRead(
  subdomain: string,
  notificationId: string,
): Promise<{ ok: true }> {
  const session = await requireClientSession(subdomain);
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_client_id", session.clientId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function markAllNotificationsRead(
  subdomain: string,
): Promise<{ ok: true; count: number }> {
  const session = await requireClientSession(subdomain);
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_client_id", session.clientId)
    .is("read_at", null)
    .select("id");
  if (error) throw new Error(error.message);
  return { ok: true, count: (data ?? []).length };
}
