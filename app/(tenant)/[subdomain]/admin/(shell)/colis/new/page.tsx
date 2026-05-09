import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { listClientsForTenant, listStatuses } from "@/lib/parcels/repo";
import { Button } from "@/components/ui/button";
import { CreateParcelForm } from "../_create-parcel-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function NewParcelPage({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);

  const [statuses, clients] = await Promise.all([
    listStatuses(session.tenant.id),
    listClientsForTenant(session.tenant.id),
  ]);

  const initial = statuses.find((s) => s.type === "initial") ?? statuses[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/colis">
            <ArrowLeft className="size-4 mr-1" />
            Retour
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Nouveau colis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Renseignez les informations de l&apos;expédition.
        </p>
      </div>

      <CreateParcelForm
        subdomain={subdomain}
        defaultCurrency={session.tenant.default_currency}
        initialStatusId={initial?.id ?? null}
        statuses={statuses.map((s) => ({
          id: s.id,
          label: s.label,
          color: s.color,
          type: s.type,
        }))}
        clients={clients}
      />
    </div>
  );
}
