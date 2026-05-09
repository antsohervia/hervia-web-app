import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { TenantTheme } from "@/lib/validations/branding";

export type TenantBranding = {
  id: string;
  theme: TenantTheme;
  primary_color: string;
  secondary_color: string | null;
  logo_url: string | null;
};

export type ThemeHistoryEntry = {
  id: string;
  theme: TenantTheme;
  primary_color: string;
  secondary_color: string | null;
  logo_url: string | null;
  published_at: string;
  published_by_email: string | null;
};

export async function getTenantBranding(
  tenantId: string,
): Promise<TenantBranding | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("tenants")
    .select("id, theme, primary_color, secondary_color, logo_url")
    .eq("id", tenantId)
    .maybeSingle();
  return (data as TenantBranding | null) ?? null;
}

export async function getThemeHistory(
  tenantId: string,
  limit = 5,
): Promise<ThemeHistoryEntry[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("tenant_theme_history")
    .select("id, theme, primary_color, secondary_color, logo_url, published_at, published_by")
    .eq("tenant_id", tenantId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  const userIds = Array.from(
    new Set(
      data
        .map((r) => r.published_by as string | null)
        .filter((u): u is string => !!u),
    ),
  );
  const emails = new Map<string, string>();
  for (const uid of userIds) {
    const { data: u } = await admin.auth.admin.getUserById(uid);
    if (u?.user?.email) emails.set(uid, u.user.email);
  }

  return data.map((r) => ({
    id: r.id as string,
    theme: r.theme as TenantTheme,
    primary_color: r.primary_color as string,
    secondary_color: (r.secondary_color as string | null) ?? null,
    logo_url: (r.logo_url as string | null) ?? null,
    published_at: r.published_at as string,
    published_by_email:
      (r.published_by && emails.get(r.published_by as string)) || null,
  }));
}
