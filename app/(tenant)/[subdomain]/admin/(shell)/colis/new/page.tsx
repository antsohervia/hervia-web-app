import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { listStatuses } from "@/lib/parcels/repo";
import { listTransportModes } from "@/lib/transport-modes/repo";
import { Button } from "@/components/ui/button";
import { CreateParcelForm } from "../_create-parcel-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function NewParcelPage({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);
  const t = await getTranslations("parcels");
  const tCommon = await getTranslations("common");

  const [statuses, transportModes] = await Promise.all([
    listStatuses(session.tenant.id),
    listTransportModes(session.tenant.id),
  ]);

  const initial =
    statuses.find((s) => s.type === "initial") ??
    statuses.find((s) => s.code !== "pending_client_response") ??
    statuses[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/colis">
            <ArrowLeft className="size-4 mr-1" />
            {tCommon("back")}
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">{t("form.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("form.subtitle")}
        </p>
      </div>

      <CreateParcelForm
        subdomain={subdomain}
        defaultCurrency={session.tenant.default_currency}
        initialStatusId={initial?.id ?? null}
        statuses={statuses
          .filter((s) => s.code !== "pending_client_response")
          .map((s) => ({
            id: s.id,
            label: s.label,
            color: s.color,
            type: s.type,
          }))}
        transportModes={transportModes.map((m) => ({
          id: m.id,
          label: m.label,
        }))}
      />
    </div>
  );
}
