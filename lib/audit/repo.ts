import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type AuditLogRow = {
  id: string;
  created_at: string;
  action: string;
  actor_email: string | null;
  actor_id: string | null;
  tenant_id: string | null;
  tenant_subdomain: string | null;
  payload: Record<string, unknown>;
};

export type AuditListParams = {
  q?: string;
  action?: string;
  tenantId?: string;
  actorEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type AuditListResult = {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
};

export const AUDIT_DEFAULT_PAGE_SIZE = 50;
export const AUDIT_EXPORT_LIMIT = 50_000;

// Le typage générique de PostgREST est trop profond pour le compilateur
// quand on chaîne plusieurs filtres conditionnels — on utilise donc un
// adaptateur structurel local.
type Filterable = {
  eq: (col: string, v: string) => Filterable;
  ilike: (col: string, v: string) => Filterable;
  gte: (col: string, v: string) => Filterable;
  lte: (col: string, v: string) => Filterable;
  or: (filter: string) => Filterable;
  order: (col: string, opts?: { ascending?: boolean }) => Filterable;
  range: (from: number, to: number) => Filterable;
  limit: (n: number) => Filterable;
};

function applyFilters(base: unknown, p: AuditListParams): Filterable {
  let q = base as Filterable;
  if (p.action) q = q.eq("action", p.action);
  if (p.tenantId) q = q.eq("tenant_id", p.tenantId);
  if (p.actorEmail) {
    const like = `%${p.actorEmail.replace(/[%_]/g, "")}%`;
    q = q.ilike("actor_email", like);
  }
  if (p.dateFrom) q = q.gte("created_at", p.dateFrom);
  if (p.dateTo) q = q.lte("created_at", p.dateTo);
  if (p.q) {
    const like = `%${p.q.replace(/[%_]/g, "")}%`;
    q = q.or(`action.ilike.${like},actor_email.ilike.${like}`);
  }
  return q;
}

async function enrichTenants(
  rows: Array<Omit<AuditLogRow, "tenant_subdomain">>,
): Promise<AuditLogRow[]> {
  const admin = createSupabaseAdmin();
  const tenantIds = Array.from(
    new Set(rows.map((r) => r.tenant_id).filter((id): id is string => !!id)),
  );
  let map = new Map<string, string>();
  if (tenantIds.length > 0) {
    const { data } = await admin
      .from("tenants")
      .select("id, subdomain")
      .in("id", tenantIds);
    map = new Map(
      (data ?? []).map((t) => [t.id as string, t.subdomain as string]),
    );
  }
  return rows.map((r) => ({
    ...r,
    tenant_subdomain: r.tenant_id ? map.get(r.tenant_id) ?? null : null,
  }));
}

export async function listAuditLogs(
  p: AuditListParams,
): Promise<AuditListResult> {
  const admin = createSupabaseAdmin();
  const page = Math.max(1, p.page ?? 1);
  const pageSize = Math.max(
    1,
    Math.min(200, p.pageSize ?? AUDIT_DEFAULT_PAGE_SIZE),
  );

  const base = admin
    .from("audit_logs")
    .select("id, created_at, action, actor_email, actor_id, tenant_id, payload", {
      count: "exact",
    });
  const filtered = applyFilters(base, p);
  const query = filtered
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = (await (query as unknown as PromiseLike<{
    data: Array<Record<string, unknown>> | null;
    count: number | null;
    error: { message: string } | null;
  }>));
  if (error) throw new Error(error.message);

  const rows = await enrichTenants(
    (data ?? []).map((r) => ({
      id: r.id as string,
      created_at: r.created_at as string,
      action: r.action as string,
      actor_email: (r.actor_email as string | null) ?? null,
      actor_id: (r.actor_id as string | null) ?? null,
      tenant_id: (r.tenant_id as string | null) ?? null,
      payload: (r.payload as Record<string, unknown>) ?? {},
    })),
  );

  return { rows, total: count ?? 0, page, pageSize };
}

export async function getDistinctAuditActions(): Promise<string[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("audit_logs")
    .select("action")
    .order("action", { ascending: true })
    .limit(1000);
  if (error) throw new Error(error.message);
  const set = new Set<string>();
  for (const r of data ?? []) set.add(r.action as string);
  return Array.from(set);
}

export async function fetchAuditLogsForExport(
  p: AuditListParams,
): Promise<AuditLogRow[]> {
  const admin = createSupabaseAdmin();
  const base = admin
    .from("audit_logs")
    .select("id, created_at, action, actor_email, actor_id, tenant_id, payload");
  const filtered = applyFilters(base, p);
  const query = filtered
    .order("created_at", { ascending: false })
    .limit(AUDIT_EXPORT_LIMIT);

  const { data, error } = (await (query as unknown as PromiseLike<{
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  }>));
  if (error) throw new Error(error.message);

  return enrichTenants(
    (data ?? []).map((r) => ({
      id: r.id as string,
      created_at: r.created_at as string,
      action: r.action as string,
      actor_email: (r.actor_email as string | null) ?? null,
      actor_id: (r.actor_id as string | null) ?? null,
      tenant_id: (r.tenant_id as string | null) ?? null,
      payload: (r.payload as Record<string, unknown>) ?? {},
    })),
  );
}

export async function getKnownTenantsForFilter(): Promise<
  Array<{ id: string; subdomain: string; name: string }>
> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("tenants")
    .select("id, subdomain, name")
    .order("subdomain", { ascending: true })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    subdomain: r.subdomain as string,
    name: r.name as string,
  }));
}
