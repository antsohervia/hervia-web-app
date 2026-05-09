import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { listParcels, listStatuses } from "@/lib/parcels/repo";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" });

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function ParcelsListPage({ params, searchParams }: Props) {
  const { subdomain } = await params;
  const sp = await searchParams;
  const session = await requireTenantSession(subdomain);
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10)) : 1;

  const [{ rows, total }, statuses] = await Promise.all([
    listParcels(session.tenant.id, {
      q: sp.q,
      statusId: sp.status,
      page,
      pageSize: 25,
    }),
    listStatuses(session.tenant.id),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Colis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} colis enregistré{total > 1 ? "s" : ""}.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/colis/new">
            <Plus className="size-4 mr-1" />
            Nouveau colis
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Recherche</label>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Référence..."
            className="flex h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Statut</label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Tous</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" size="sm">
          Filtrer
        </Button>
      </form>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Livraison estimée</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Package className="size-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun colis pour le moment.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.reference}</TableCell>
                  <TableCell>{r.client_name ?? "—"}</TableCell>
                  <TableCell>
                    {r.status_label ? (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{
                          background: r.status_color ?? "#6B7280",
                        }}
                      >
                        {r.status_label}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{r.destination_country ?? "—"}</TableCell>
                  <TableCell>
                    {r.estimated_delivery_at
                      ? dateFmt.format(new Date(r.estimated_delivery_at))
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/colis/${r.id}`}>
                        Voir
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
