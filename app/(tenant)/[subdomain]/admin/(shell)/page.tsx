import Link from "next/link";
import { Package, Palette, Tags } from "lucide-react";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function TenantAdminHome({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);

  const admin = createSupabaseAdmin();
  const [parcels, clients, statuses] = await Promise.all([
    admin
      .from("parcels")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.tenant.id),
    admin
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.tenant.id),
    admin
      .from("parcel_statuses")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.tenant.id),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenue, {session.tenant.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue synthétique de votre activité.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {parcels.count ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {clients.count ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Statuts configurés
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {statuses.count ?? 0}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <Link
          href="/admin/colis"
          className="rounded-lg border bg-card p-5 hover:bg-accent transition"
        >
          <Package className="size-5 mb-2" />
          <p className="font-medium">Gérer les colis</p>
          <p className="text-muted-foreground mt-1">
            Créer, mettre à jour le statut, suivre les expéditions.
          </p>
        </Link>
        <Link
          href="/admin/statuts"
          className="rounded-lg border bg-card p-5 hover:bg-accent transition"
        >
          <Tags className="size-5 mb-2" />
          <p className="font-medium">Configurer les statuts</p>
          <p className="text-muted-foreground mt-1">
            Aligner le workflow sur votre processus logistique.
          </p>
        </Link>
        {session.role === "entreprise_admin" ? (
          <Link
            href="/admin/apparence"
            className="rounded-lg border bg-card p-5 hover:bg-accent transition"
          >
            <Palette className="size-5 mb-2" />
            <p className="font-medium">Apparence</p>
            <p className="text-muted-foreground mt-1">
              Logo, thème et couleurs de votre marque.
            </p>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
