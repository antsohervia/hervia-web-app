import Link from "next/link";
import { Building2, Package, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGlobalKpis } from "@/lib/tenants/repo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const kpis = await getGlobalKpis();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {"Vue d'ensemble de la plateforme"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants/new">Nouveau tenant</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={<Building2 className="size-4" />}
          title="Tenants actifs"
          value={kpis.activeTenants}
          description="Espaces transitaires en service"
        />
        <KpiCard
          icon={<Users className="size-4" />}
          title="Clients totaux"
          value={kpis.totalClients}
          description="Toutes entreprises confondues"
        />
        <KpiCard
          icon={<Package className="size-4" />}
          title="Colis en transit"
          value={kpis.parcelsInTransit}
          description="Statut « in_transit »"
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">
          {value.toLocaleString("fr-FR")}
        </div>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
