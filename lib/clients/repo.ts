import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ParcelStatusType } from "@/lib/validations/parcel-status";

function pickOne<T>(value: unknown): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}

export type ClientRecord = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "disabled" | "pending_activation";
  email_notifications_enabled: boolean;
  created_at: string;
};

export async function getClientByUserAndTenant(
  userId: string,
  tenantId: string,
): Promise<ClientRecord | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("clients")
    .select(
      "id, tenant_id, user_id, full_name, email, phone, status, email_notifications_enabled, created_at",
    )
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ClientRecord | null) ?? null;
}

export async function getClientById(
  clientId: string,
): Promise<ClientRecord | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("clients")
    .select(
      "id, tenant_id, user_id, full_name, email, phone, status, email_notifications_enabled, created_at",
    )
    .eq("id", clientId)
    .maybeSingle();
  return (data as ClientRecord | null) ?? null;
}

export async function getClientByEmailAndTenant(
  email: string,
  tenantId: string,
): Promise<ClientRecord | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("clients")
    .select(
      "id, tenant_id, user_id, full_name, email, phone, status, email_notifications_enabled, created_at",
    )
    .eq("tenant_id", tenantId)
    .ilike("email", email)
    .maybeSingle();
  return (data as ClientRecord | null) ?? null;
}

export type ClientParcelRow = {
  id: string;
  reference: string;
  description: string | null;
  status_id: string | null;
  status_label: string | null;
  status_color: string | null;
  status_type: ParcelStatusType | null;
  destination_country: string | null;
  estimated_delivery_at: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListClientParcelsParams = {
  search?: string;
  statusType?: "all" | "active" | "final";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type ListClientParcelsResult = {
  rows: ClientParcelRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listClientParcels(
  clientId: string,
  tenantId: string,
  params: ListClientParcelsParams = {},
): Promise<ListClientParcelsResult> {
  const admin = createSupabaseAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));

  let query = admin
    .from("parcels")
    .select(
      `id, reference, description, status_id, destination_country,
       estimated_delivery_at, shipped_at, created_at, updated_at,
       parcel_statuses!inner(label, color, type)`,
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId);

  if (params.search) {
    const like = `%${params.search.replace(/[%_]/g, "")}%`;
    query = query.or(`reference.ilike.${like},description.ilike.${like}`);
  }
  if (params.statusType === "active") {
    query = query.in("parcel_statuses.type", ["initial", "intermediate"]);
  } else if (params.statusType === "final") {
    query = query.eq("parcel_statuses.type", "final");
  }
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  query = query
    .order("updated_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const rows: ClientParcelRow[] = (data ?? []).map((r) => {
    const status = pickOne<{
      label: string;
      color: string;
      type: ParcelStatusType;
    }>(r.parcel_statuses);
    return {
      id: r.id as string,
      reference: r.reference as string,
      description: (r.description as string | null) ?? null,
      status_id: (r.status_id as string | null) ?? null,
      status_label: status?.label ?? null,
      status_color: status?.color ?? null,
      status_type: status?.type ?? null,
      destination_country: (r.destination_country as string | null) ?? null,
      estimated_delivery_at:
        (r.estimated_delivery_at as string | null) ?? null,
      shipped_at: (r.shipped_at as string | null) ?? null,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
    };
  });

  return { rows, total: count ?? 0, page, pageSize };
}

export type ClientParcelStats = {
  total: number;
  active: number;
  final: number;
};

export async function getClientParcelStats(
  clientId: string,
  tenantId: string,
): Promise<ClientParcelStats> {
  const admin = createSupabaseAdmin();
  const baseSelect = "id, parcel_statuses!inner(type)";
  const [totalRes, activeRes, finalRes] = await Promise.all([
    admin
      .from("parcels")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId),
    admin
      .from("parcels")
      .select(baseSelect, { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("parcel_statuses.type", ["initial", "intermediate"]),
    admin
      .from("parcels")
      .select(baseSelect, { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("parcel_statuses.type", "final"),
  ]);
  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    final: finalRes.count ?? 0,
  };
}

export type ClientParcelDetail = {
  id: string;
  reference: string;
  description: string | null;
  status_id: string | null;
  estimated_price: number | null;
  currency: string | null;
  origin_country: string | null;
  destination_country: string | null;
  shipped_at: string | null;
  estimated_delivery_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getClientParcelDetail(
  parcelId: string,
  clientId: string,
  tenantId: string,
): Promise<ClientParcelDetail | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("parcels")
    .select(
      `id, reference, description, status_id, estimated_price, currency,
       origin_country, destination_country, shipped_at, estimated_delivery_at,
       created_at, updated_at`,
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("id", parcelId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    reference: data.reference as string,
    description: (data.description as string | null) ?? null,
    status_id: (data.status_id as string | null) ?? null,
    estimated_price: (data.estimated_price as number | null) ?? null,
    currency: (data.currency as string | null) ?? null,
    origin_country: (data.origin_country as string | null) ?? null,
    destination_country: (data.destination_country as string | null) ?? null,
    shipped_at: (data.shipped_at as string | null) ?? null,
    estimated_delivery_at:
      (data.estimated_delivery_at as string | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

export async function setClientEmailPreference(
  clientId: string,
  enabled: boolean,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("clients")
    .update({ email_notifications_enabled: enabled })
    .eq("id", clientId);
  if (error) throw new Error(error.message);
}

export async function touchClientLastLogin(clientId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("clients")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", clientId);
}

export async function activateClient(clientId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("clients")
    .update({ status: "active" })
    .eq("id", clientId);
  if (error) throw new Error(error.message);
}
