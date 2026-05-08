import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getImpersonation } from "@/lib/auth/impersonation";
import { isAdminRole, type AdminRole } from "@/lib/auth/roles";

export type SessionUser = {
  user: User;
  role: string | null;
  disabled: boolean;
};

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const role = (user.app_metadata?.role as string | undefined) ?? null;
  const disabled = Boolean(user.app_metadata?.disabled);
  return { user, role, disabled };
}

export async function requireSession(redirectTo = "/admin/login"): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}

export async function requirePlatformAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.disabled) redirect("/admin/login?error=disabled");
  if (!isAdminRole(session.role)) {
    redirect("/admin/login?error=forbidden");
  }
  return session;
}

export async function requireAdminRole(
  allowed: readonly AdminRole[],
): Promise<SessionUser> {
  const session = await requirePlatformAdmin();
  if (!allowed.includes(session.role as AdminRole)) {
    redirect("/admin/login?error=forbidden");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  return requireAdminRole(["super_admin"]);
}

export async function assertNotImpersonating(): Promise<void> {
  const id = await getImpersonation();
  if (id) {
    throw new Error("Mode lecture seule (impersonification active)");
  }
}
