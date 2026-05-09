import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { listStatuses, listTransportModes } from "@/lib/parcels/repo";
import { ScanClient } from "./_scan-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function ScanPage({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);
  const [statuses, transportModes] = await Promise.all([
    listStatuses(session.tenant.id),
    listTransportModes(session.tenant.id),
  ]);

  return (
    <ScanClient
      subdomain={subdomain}
      statuses={statuses.map((s) => ({ id: s.id, label: s.label, color: s.color }))}
      transportModes={transportModes}
    />
  );
}
