import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTenants } from "@/lib/tenants/repo";
import { TenantsTable } from "./_components/tenants-table";
import { TenantsFilters } from "./_components/tenants-filters";
import { PaginationBar } from "./_components/pagination-bar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
};

const SORT_FIELDS = ["name", "subdomain", "status", "created_at"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function parseSort(value?: string): SortField {
  return SORT_FIELDS.includes(value as SortField)
    ? (value as SortField)
    : "created_at";
}

export default async function TenantsListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const order: "asc" | "desc" = sp.order === "asc" ? "asc" : "desc";
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10)) : 1;
  const status =
    sp.status === "active" || sp.status === "suspended"
      ? sp.status
      : ("all" as const);

  const { rows, total, pageSize } = await listTenants({
    q: sp.q,
    status,
    from: sp.from,
    to: sp.to,
    sort,
    order,
    page,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion globale des espaces transitaires
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants/new">
            <Plus className="size-4 mr-1" />
            Nouveau tenant
          </Link>
        </Button>
      </div>

      <TenantsFilters />

      <TenantsTable
        rows={rows}
        sort={sort}
        order={order}
        searchParams={sp}
      />

      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        searchParams={sp}
      />
    </div>
  );
}
