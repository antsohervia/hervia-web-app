import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import {
  AUDIT_DEFAULT_PAGE_SIZE,
  getDistinctAuditActions,
  getKnownTenantsForFilter,
  listAuditLogs,
} from "@/lib/audit/repo";
import { AuditFilters } from "./_components/audit-filters";
import { AuditRow } from "./_components/audit-row";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    tenantId?: string;
    actorEmail?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

function toIsoStart(d?: string): string | undefined {
  return d ? new Date(`${d}T00:00:00`).toISOString() : undefined;
}
function toIsoEnd(d?: string): string | undefined {
  return d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined;
}

export default async function AuditPage({ searchParams }: Props) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10)) : 1;

  const [{ rows, total, pageSize }, actions, tenants] = await Promise.all([
    listAuditLogs({
      q: sp.q,
      action: sp.action,
      tenantId: sp.tenantId,
      actorEmail: sp.actorEmail,
      dateFrom: toIsoStart(sp.from),
      dateTo: toIsoEnd(sp.to),
      page,
      pageSize: AUDIT_DEFAULT_PAGE_SIZE,
    }),
    getDistinctAuditActions(),
    getKnownTenantsForFilter(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function href(p: number) {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.action) params.set("action", sp.action);
    if (sp.tenantId) params.set("tenantId", sp.tenantId);
    if (sp.actorEmail) params.set("actorEmail", sp.actorEmail);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    params.set("page", String(p));
    return `/admin/audit?${params.toString()}`;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Journal d&apos;audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toutes les actions sensibles enregistrées sur la plateforme.
          </p>
        </div>
      </div>

      <AuditFilters
        actions={actions}
        tenants={tenants.map((t) => ({ id: t.id, subdomain: t.subdomain }))}
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Acteur</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="w-24">Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <AuditRow key={r.id} row={r} />
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  Aucune entrée correspondante.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Page {page} / {totalPages} · {total} entrée{total > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page <= 1}
              aria-disabled={page <= 1}
            >
              <Link href={page > 1 ? href(page - 1) : "#"}>Précédent</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              aria-disabled={page >= totalPages}
            >
              <Link href={page < totalPages ? href(page + 1) : "#"}>
                Suivant
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-3">
          {total} entrée{total > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
