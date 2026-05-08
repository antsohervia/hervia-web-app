import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/auth/dal";

export type AuditEntry = {
  session: Pick<SessionUser, "user">;
  action: string;
  tenantId?: string | null;
  payload?: Record<string, unknown>;
  client?: SupabaseClient;
};

export async function logAudit({
  session,
  action,
  tenantId = null,
  payload = {},
  client,
}: AuditEntry): Promise<void> {
  const admin = client ?? createSupabaseAdmin();
  await admin.from("audit_logs").insert({
    actor_id: session.user.id,
    actor_email: session.user.email,
    action,
    tenant_id: tenantId,
    payload,
  });
}
