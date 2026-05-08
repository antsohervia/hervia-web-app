import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/roles";

export type AdminAccount = {
  id: string;
  email: string;
  role: AdminRole;
  disabled: boolean;
  lastSignInAt: string | null;
  createdAt: string;
};

const PAGE_SIZE = 200;

export async function listAdmins(): Promise<AdminAccount[]> {
  const admin = createSupabaseAdmin();
  const out: AdminAccount[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw new Error(error.message);
    if (!data) break;
    for (const u of data.users) {
      const role = (u.app_metadata?.role as string | undefined) ?? null;
      if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) continue;
      out.push({
        id: u.id,
        email: u.email ?? "",
        role: role as AdminRole,
        disabled: Boolean(u.app_metadata?.disabled),
        lastSignInAt: u.last_sign_in_at ?? null,
        createdAt: u.created_at,
      });
    }
    if (data.users.length < PAGE_SIZE) break;
    page += 1;
  }
  out.sort((a, b) => a.email.localeCompare(b.email));
  return out;
}

export async function getAdmin(id: string): Promise<AdminAccount | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data?.user) return null;
  const u = data.user;
  const role = (u.app_metadata?.role as string | undefined) ?? null;
  if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    role: role as AdminRole,
    disabled: Boolean(u.app_metadata?.disabled),
    lastSignInAt: u.last_sign_in_at ?? null,
    createdAt: u.created_at,
  };
}

export async function countActiveSuperAdmins(): Promise<number> {
  const all = await listAdmins();
  return all.filter((a) => a.role === "super_admin" && !a.disabled).length;
}
