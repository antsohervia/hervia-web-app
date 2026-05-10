import { getTranslations } from "next-intl/server";
import { requireTenantAdmin } from "@/lib/auth/tenant-dal";
import { getTenantBranding } from "@/lib/branding/repo";
import { LogoCard } from "./_logo-card";
import { ThemeStudio } from "./_theme-studio";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function AppearancePage({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantAdmin(subdomain);
  const [branding, t] = await Promise.all([
    getTenantBranding(session.tenant.id),
    getTranslations("appearance"),
  ]);

  if (!branding) {
    return <div className="p-8">{t("unavailable")}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <LogoCard
        subdomain={subdomain}
        logoUrl={branding.logo_url}
        tenantName={session.tenant.name}
      />

      <ThemeStudio
        subdomain={subdomain}
        tenantName={session.tenant.name}
        logoUrl={branding.logo_url}
        currentTheme={branding.theme}
        currentPrimary={branding.primary_color}
        currentSecondary={branding.secondary_color}
      />
    </div>
  );
}
