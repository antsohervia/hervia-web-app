import Link from "next/link";
import { Plus, Package, ChevronRight, ScanBarcode } from "lucide-react";
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Colis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} colis enregistré{total > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/colis/scan">
              <ScanBarcode className="size-4 mr-1" />
              Scan en lot
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/colis/new">
              <Plus className="size-4 mr-1" />
              Nouveau colis
            </Link>
          </Button>
        </div>
      </div>

      <form className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-end gap-3">
        <div className="space-y-1 sm:w-64">
          <label className="text-xs text-muted-foreground">Recherche</label>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Numéro de tracking..."
            className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Statut</label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="flex h-11 sm:h-9 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
          >
            <option value="">Tous</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" className="w-full sm:w-auto">
          Filtrer
        </Button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-md border bg-card p-10 text-center">
          <Package className="size-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucun colis pour le moment.
          </p>
        </div>
      ) : (
        <>
          <ul className="md:hidden space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/colis/${r.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-4 active:bg-accent min-h-16"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{r.reference}</span>
                      {r.status_label ? (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                          style={{ background: r.status_color ?? "#6B7280" }}
                        >
                          {r.status_label}
                        </span>
                      ) : null}
                      {r.is_client_initiated ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-primary/40 text-primary">
                          Initié par le client
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.client_name ?? "—"}
                      {r.transport_mode_label
                        ? ` · ${r.transport_mode_label}`
                        : ""}
                      {r.destination_country
                        ? ` · ${r.destination_country}`
                        : ""}
                      {r.estimated_delivery_at
                        ? ` · ${dateFmt.format(new Date(r.estimated_delivery_at))}`
                        : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block rounded-md border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de tracking</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Livraison estimée</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
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
                    <TableCell>{r.transport_mode_label ?? "—"}</TableCell>
                    <TableCell>
                      {r.is_client_initiated ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border border-primary/40 text-primary">
                          Client
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Tenant
                        </span>
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
                        <Link href={`/admin/colis/${r.id}`}>Voir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
