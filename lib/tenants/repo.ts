import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type GlobalKpis = {
  activeTenants: number;
  totalClients: number;
  parcelsInTransit: number;
};

export async function getGlobalKpis(): Promise<GlobalKpis> {
  const admin = createSupabaseAdmin();
  const [tenantsRes, clientsRes, parcelsRes] = await Promise.all([
    admin
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("clients").select("id", { count: "exact", head: true }),
    admin
      .from("parcels")
      .select("id, parcel_statuses!inner(kind)", { count: "exact", head: true })
      .eq("parcel_statuses.kind", "in_transit"),
  ]);

  return {
    activeTenants: tenantsRes.count ?? 0,
    totalClients: clientsRes.count ?? 0,
    parcelsInTransit: parcelsRes.count ?? 0,
  };
}

export type TenantRow = {
  id: string;
  name: string;
  subdomain: string;
  status: "active" | "suspended" | "deleted";
  created_at: string;
  client_count: number;
  parcel_count: number;
};

export type TenantsListParams = {
  q?: string;
  status?: "active" | "suspended" | "all";
  from?: string;
  to?: string;
  sort?: "name" | "subdomain" | "status" | "created_at";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type TenantsListResult = {
  rows: TenantRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listTenants(p: TenantsListParams): Promise<TenantsListResult> {
  const admin = createSupabaseAdmin();
  const page = Math.max(1, p.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, p.pageSize ?? 25));

  let query = admin
    .from("tenants")
    .select(
      "id, name, subdomain, status, created_at, clients(count), parcels(count)",
      { count: "exact" },
    )
    .neq("status", "deleted");

  if (p.status && p.status !== "all") query = query.eq("status", p.status);
  if (p.q) {
    const like = `%${p.q.replace(/[%_]/g, "")}%`;
    query = query.or(`name.ilike.${like},subdomain.ilike.${like}`);
  }
  if (p.from) query = query.gte("created_at", p.from);
  if (p.to) query = query.lte("created_at", p.to);

  query = query
    .order(p.sort ?? "created_at", { ascending: p.order === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const rows: TenantRow[] = (data ?? []).map((r) => {
    const clients = (r.clients as { count: number }[] | null) ?? [];
    const parcels = (r.parcels as { count: number }[] | null) ?? [];
    return {
      id: r.id as string,
      name: r.name as string,
      subdomain: r.subdomain as string,
      status: r.status as TenantRow["status"],
      created_at: r.created_at as string,
      client_count: clients[0]?.count ?? 0,
      parcel_count: parcels[0]?.count ?? 0,
    };
  });

  return { rows, total: count ?? 0, page, pageSize };
}

export type TenantDetail = {
  id: string;
  name: string;
  subdomain: string;
  country: string;
  default_currency: string;
  timezone: string;
  status: "active" | "suspended" | "deleted";
  logo_url: string | null;
  suspension_reason: string | null;
  suspension_note: string | null;
  suspension_message: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getTenant(id: string): Promise<TenantDetail | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as TenantDetail | null) ?? null;
}

export async function getTenantBySubdomain(
  subdomain: string,
): Promise<TenantDetail | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("tenants")
    .select("*")
    .eq("subdomain", subdomain)
    .maybeSingle();
  return (data as TenantDetail | null) ?? null;
}
