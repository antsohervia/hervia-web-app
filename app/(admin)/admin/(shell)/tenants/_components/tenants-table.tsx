import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TenantRow } from "@/lib/tenants/repo";

type SortField = "name" | "subdomain" | "status" | "created_at";

type Props = {
  rows: TenantRow[];
  sort: SortField;
  order: "asc" | "desc";
  searchParams: Record<string, string | undefined>;
};

function buildSortHref(
  current: Record<string, string | undefined>,
  field: SortField,
  currentSort: SortField,
  currentOrder: "asc" | "desc",
): string {
  const next: Record<string, string | undefined> = { ...current };
  next.sort = field;
  if (currentSort === field) {
    next.order = currentOrder === "asc" ? "desc" : "asc";
  } else {
    next.order = "asc";
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  return `?${params.toString()}`;
}

function StatusBadge({ status }: { status: TenantRow["status"] }) {
  if (status === "active") {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
        Actif
      </Badge>
    );
  }
  if (status === "suspended") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        Suspendu
      </Badge>
    );
  }
  return <Badge variant="secondary">Supprimé</Badge>;
}

function SortHeader({
  field,
  label,
  sort,
  order,
  searchParams,
}: {
  field: SortField;
  label: string;
  sort: SortField;
  order: "asc" | "desc";
  searchParams: Record<string, string | undefined>;
}) {
  const Icon =
    sort === field ? (order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link
      href={buildSortHref(searchParams, field, sort, order)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <Icon className="size-3" />
    </Link>
  );
}

export function TenantsTable({ rows, sort, order, searchParams }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        Aucun tenant ne correspond aux critères.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader
                field="name"
                label="Nom"
                sort={sort}
                order={order}
                searchParams={searchParams}
              />
            </TableHead>
            <TableHead>
              <SortHeader
                field="subdomain"
                label="Sous-domaine"
                sort={sort}
                order={order}
                searchParams={searchParams}
              />
            </TableHead>
            <TableHead>
              <SortHeader
                field="status"
                label="Statut"
                sort={sort}
                order={order}
                searchParams={searchParams}
              />
            </TableHead>
            <TableHead>
              <SortHeader
                field="created_at"
                label="Créé le"
                sort={sort}
                order={order}
                searchParams={searchParams}
              />
            </TableHead>
            <TableHead className="text-right">Clients</TableHead>
            <TableHead className="text-right">Colis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link
                  href={`/admin/tenants/${r.id}`}
                  className="hover:underline"
                >
                  {r.name}
                </Link>
              </TableCell>
              <TableCell>
                <code className="text-xs">{r.subdomain}</code>
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell className="text-right">{r.client_count}</TableCell>
              <TableCell className="text-right">{r.parcel_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
