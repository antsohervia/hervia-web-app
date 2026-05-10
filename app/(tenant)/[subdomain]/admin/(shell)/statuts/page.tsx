import { getLocale, getTranslations } from "next-intl/server";
import { requireTenantAdmin } from "@/lib/auth/tenant-dal";
import { listStatuses } from "@/lib/parcels/repo";
import { StatusesManager } from "./_statuses-manager";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function StatusesPage({ params }: Props) {
  const { subdomain } = await params;
  const [session, locale] = await Promise.all([
    requireTenantAdmin(subdomain),
    getLocale(),
  ]);
  const [statuses, t] = await Promise.all([
    listStatuses(session.tenant.id, locale),
    getTranslations("statuses"),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>
      <StatusesManager subdomain={subdomain} initialStatuses={statuses} />
    </div>
  );
}
