import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain, type TenantDetail } from "@/lib/tenants/repo";

export type ClientStatus = "active" | "disabled" | "pending_activation";

export type ClientSession = {
  tenant: TenantDetail;
  userId: string;
  email: string | null;
  clientId: string;
  fullName: string;
  emailNotificationsEnabled: boolean;
};

/**
 * Garde la route : exige un utilisateur Supabase connecté ET rattaché à
 * une ligne `clients` active de ce tenant.
 *
 * Redirige sinon :
 * - tenant inexistant / supprimé  → /
 * - tenant suspendu                → /suspended
 * - pas de session                 → /login
 * - session existe mais c'est un membre `tenant_members` du tenant
 *   (admin/op) → /admin (un admin n'utilise pas l'espace client)
 * - pas de ligne `clients` pour ce tenant (sous-domaine erroné, US-C1.1)
 *   → signOut + /login
 * - statut `disabled`              → signOut + /login?error=disabled
 * - statut `pending_activation`    → /login?error=pending_activation
 */
export async function requireClientSession(
  subdomain: string,
): Promise<ClientSession> {
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") redirect("/");
  if (tenant.status === "suspended") redirect("/suspended");

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createSupabaseAdmin();

  // Refus si l'utilisateur est déjà membre tenant-admin du tenant : il a
  // un autre espace dédié, pas d'usurpation possible.
  const { data: member } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (member) redirect("/admin");

  const { data: client } = await admin
    .from("clients")
    .select("id, full_name, status, email_notifications_enabled")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const status = client.status as ClientStatus;
  if (status === "disabled") {
    await supabase.auth.signOut();
    redirect("/login?error=disabled");
  }
  if (status === "pending_activation") {
    redirect("/login?error=pending_activation");
  }

  return {
    tenant,
    userId: user.id,
    email: user.email ?? null,
    clientId: client.id as string,
    fullName: client.full_name as string,
    emailNotificationsEnabled: client.email_notifications_enabled as boolean,
  };
}
