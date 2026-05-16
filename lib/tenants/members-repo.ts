import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { TenantMemberRole } from "@/lib/auth/tenant-dal";

export type TenantMemberStatus = "active" | "pending";

export type TenantMemberAccount = {
  id: string;
  userId: string;
  email: string;
  role: TenantMemberRole;
  status: TenantMemberStatus;
  invitedAt: string;
  lastSignInAt: string | null;
  isSelf: boolean;
};

const PAGE_SIZE = 200;

async function listAllAuthUsers(): Promise<
  Map<
    string,
    {
      email: string | null;
      emailConfirmedAt: string | null;
      lastSignInAt: string | null;
    }
  >
> {
  const admin = createSupabaseAdmin();
  const map = new Map<
    string,
    {
      email: string | null;
      emailConfirmedAt: string | null;
      lastSignInAt: string | null;
    }
  >();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw new Error(error.message);
    if (!data) break;
    for (const u of data.users) {
      map.set(u.id, {
        email: u.email ?? null,
        emailConfirmedAt: u.email_confirmed_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }
    if (data.users.length < PAGE_SIZE) break;
    page += 1;
  }
  return map;
}

export async function listTenantMembers(
  tenantId: string,
  currentUserId: string,
): Promise<TenantMemberAccount[]> {
  const admin = createSupabaseAdmin();
  const { data: rows, error } = await admin
    .from("tenant_members")
    .select("id, user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  const users = await listAllAuthUsers();
  const out: TenantMemberAccount[] = [];
  for (const row of rows) {
    const u = users.get(row.user_id as string);
    out.push({
      id: row.id as string,
      userId: row.user_id as string,
      email: u?.email ?? "—",
      role: row.role as TenantMemberRole,
      status: u?.emailConfirmedAt ? "active" : "pending",
      invitedAt: row.created_at as string,
      lastSignInAt: u?.lastSignInAt ?? null,
      isSelf: (row.user_id as string) === currentUserId,
    });
  }
  out.sort((a, b) => a.email.localeCompare(b.email));
  return out;
}

export async function getTenantMember(
  tenantId: string,
  memberId: string,
): Promise<{
  id: string;
  userId: string;
  role: TenantMemberRole;
} | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("tenant_members")
    .select("id, user_id, role")
    .eq("tenant_id", tenantId)
    .eq("id", memberId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    userId: data.user_id as string,
    role: data.role as TenantMemberRole,
  };
}

export async function countActiveTenantAdmins(
  tenantId: string,
): Promise<number> {
  const admin = createSupabaseAdmin();
  const { count, error } = await admin
    .from("tenant_members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "entreprise_admin");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type ExistingAuthUser = {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
  userMetadata: Record<string, unknown>;
};

export async function findUserAndMembershipByEmail(
  tenantId: string,
  email: string,
): Promise<{
  authUser: ExistingAuthUser | null;
  membership: { userId: string; role: TenantMemberRole } | null;
}> {
  const admin = createSupabaseAdmin();
  const normalized = email.trim().toLowerCase();
  let page = 1;
  let match: ExistingAuthUser | null = null;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw new Error(error.message);
    if (!data) break;
    const found = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === normalized,
    );
    if (found) {
      match = {
        id: found.id,
        email: found.email ?? normalized,
        emailConfirmedAt: found.email_confirmed_at ?? null,
        userMetadata:
          (found.user_metadata as Record<string, unknown> | null) ?? {},
      };
      break;
    }
    if (data.users.length < PAGE_SIZE) break;
    page += 1;
  }

  if (!match) {
    return { authUser: null, membership: null };
  }

  const { data: member } = await admin
    .from("tenant_members")
    .select("user_id, role")
    .eq("tenant_id", tenantId)
    .eq("user_id", match.id)
    .maybeSingle();

  return {
    authUser: match,
    membership: member
      ? {
          userId: member.user_id as string,
          role: member.role as TenantMemberRole,
        }
      : null,
  };
}
