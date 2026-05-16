import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain, type TenantDetail } from "@/lib/tenants/repo";
import { getImpersonation } from "@/lib/auth/impersonation";

export type TenantMemberRole = "entreprise_admin" | "entreprise_member";

export type TenantSession = {
  tenant: TenantDetail;
  userId: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: TenantMemberRole;
  impersonating: boolean;
};

export async function requireTenantSession(
  subdomain: string,
): Promise<TenantSession> {
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") {
    redirect("/admin/login?error=not_found");
  }
  if (tenant.status === "suspended") {
    redirect("/suspended");
  }

  const impersonating = (await getImpersonation()) === tenant.id;

  if (impersonating) {
    return {
      tenant,
      userId: "impersonation",
      email: null,
      fullName: null,
      phone: null,
      role: "entreprise_admin",
      impersonating: true,
    };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = createSupabaseAdmin();
  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) redirect("/admin/login?error=forbidden");

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawName =
    typeof meta.display_name === "string"
      ? meta.display_name
      : typeof meta.full_name === "string"
        ? meta.full_name
        : typeof meta.name === "string"
          ? meta.name
          : null;
  const fullName = rawName?.trim() ? rawName.trim() : null;

  const rawPhone =
    typeof meta.phone === "string" ? meta.phone : user.phone ?? null;
  const phone = rawPhone?.trim() ? rawPhone.trim() : null;

  return {
    tenant,
    userId: user.id,
    email: user.email ?? null,
    fullName,
    phone,
    role: member.role as TenantMemberRole,
    impersonating: false,
  };
}

export async function requireTenantAdmin(
  subdomain: string,
): Promise<TenantSession> {
  const session = await requireTenantSession(subdomain);
  if (session.role !== "entreprise_admin") {
    redirect("/admin?error=forbidden");
  }
  return session;
}

export function assertNotImpersonatingTenant(session: TenantSession): void {
  if (session.impersonating) {
    throw new Error("Lecture seule (mode impersonification active)");
  }
}
