import "server-only";
import archiver from "archiver";
import { stringify } from "csv-stringify/sync";
import { Readable } from "node:stream";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const TABLES = ["clients", "parcels", "parcel_statuses", "audit_logs"] as const;

export async function buildTenantExportStream(tenantId: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  filename: string;
}> {
  const admin = createSupabaseAdmin();
  const { data: tenant, error } = await admin
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();
  if (error || !tenant) throw new Error("Tenant introuvable");

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.append(JSON.stringify(tenant, null, 2), { name: "tenant.json" });

  for (const table of TABLES) {
    const { data, error: e } = await admin
      .from(table)
      .select("*")
      .eq("tenant_id", tenantId);
    if (e) throw new Error(`Échec export ${table}: ${e.message}`);
    const rows = data ?? [];
    archive.append(JSON.stringify(rows, null, 2), { name: `${table}.json` });
    const csv = rows.length
      ? stringify(rows as Record<string, unknown>[], { header: true })
      : "";
    archive.append(csv, { name: `${table}.csv` });
  }

  archive.finalize();

  const stream = Readable.toWeb(
    archive as unknown as Readable,
  ) as ReadableStream<Uint8Array>;

  return {
    stream,
    filename: `tenant-${tenant.subdomain}-export.zip`,
  };
}
