import { requireTenantAdmin } from "@/lib/auth/tenant-dal";
import { listTransportModes } from "@/lib/transport-modes/repo";
import { TransportModesManager } from "./_modes-manager";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function TransportModesPage({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantAdmin(subdomain);
  const modes = await listTransportModes(session.tenant.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">
          Modes de transport
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez les modes proposés au client lorsqu&apos;il enregistre un
          colis.
        </p>
      </div>
      <TransportModesManager subdomain={subdomain} initialModes={modes} />
    </div>
  );
}
