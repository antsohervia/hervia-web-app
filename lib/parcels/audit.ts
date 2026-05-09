import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantSession } from "@/lib/auth/tenant-dal";

export async function logTenantAudit(
  client: SupabaseClient,
  session: TenantSession,
  action: string,
  payload: Record<string, unknown>,
) {
  await client.from("audit_logs").insert({
    actor_id: session.userId === "impersonation" ? null : session.userId,
    actor_email: session.email,
    action,
    tenant_id: session.tenant.id,
    payload,
  });
}
