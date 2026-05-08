import { NextResponse, type NextRequest } from "next/server";
import { stringify } from "csv-stringify/sync";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import { fetchAuditLogsForExport } from "@/lib/audit/repo";
import { logAudit } from "@/lib/audit/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toIsoStart(d: string | null): string | undefined {
  return d ? new Date(`${d}T00:00:00`).toISOString() : undefined;
}
function toIsoEnd(d: string | null): string | undefined {
  return d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined;
}

export async function GET(req: NextRequest) {
  const session = await requirePlatformAdmin();
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "json" ? "json" : "csv";

  const filters = {
    q: sp.get("q") ?? undefined,
    action: sp.get("action") ?? undefined,
    tenantId: sp.get("tenantId") ?? undefined,
    actorEmail: sp.get("actorEmail") ?? undefined,
    dateFrom: toIsoStart(sp.get("from")),
    dateTo: toIsoEnd(sp.get("to")),
  };

  try {
    const rows = await fetchAuditLogsForExport(filters);

    await logAudit({
      session,
      action: "audit.export",
      payload: {
        format,
        filters,
        row_count: rows.length,
      },
    });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "json") {
      const body = JSON.stringify(rows, null, 2);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="audit-${stamp}.json"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const csv = stringify(
      rows.map((r) => ({
        created_at: r.created_at,
        action: r.action,
        actor_email: r.actor_email ?? "",
        actor_id: r.actor_id ?? "",
        tenant_id: r.tenant_id ?? "",
        tenant_subdomain: r.tenant_subdomain ?? "",
        payload: JSON.stringify(r.payload ?? {}),
      })),
      {
        header: true,
        columns: [
          "created_at",
          "action",
          "actor_email",
          "actor_id",
          "tenant_id",
          "tenant_subdomain",
          "payload",
        ],
      },
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new NextResponse(`Export failed: ${(e as Error).message}`, {
      status: 503,
    });
  }
}
