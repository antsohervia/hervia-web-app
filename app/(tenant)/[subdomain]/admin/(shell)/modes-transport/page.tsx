import { getLocale, getTranslations } from "next-intl/server";
import { requireTenantAdmin } from "@/lib/auth/tenant-dal";
import { listTransportModes } from "@/lib/transport-modes/repo";
import { TransportModesManager } from "./_modes-manager";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function TransportModesPage({ params }: Props) {
  const { subdomain } = await params;
  const [session, locale] = await Promise.all([
    requireTenantAdmin(subdomain),
    getLocale(),
  ]);
  const [modes, t] = await Promise.all([
    listTransportModes(session.tenant.id, locale),
    getTranslations("transportModes"),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>
      <TransportModesManager subdomain={subdomain} initialModes={modes} />
    </div>
  );
}
