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
