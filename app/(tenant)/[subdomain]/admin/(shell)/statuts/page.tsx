import { requireTenantAdmin } from "@/lib/auth/tenant-dal";
import { listStatuses } from "@/lib/parcels/repo";
import { StatusesManager } from "./_statuses-manager";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function StatusesPage({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantAdmin(subdomain);
  const statuses = await listStatuses(session.tenant.id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Statuts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez les étapes du cycle de vie de vos colis.
        </p>
      </div>
      <StatusesManager subdomain={subdomain} initialStatuses={statuses} />
    </div>
  );
}
