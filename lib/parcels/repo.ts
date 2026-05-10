import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ParcelStatusType } from "@/lib/validations/parcel-status";

function pickOne<T>(value: unknown): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}

export type ParcelStatus = {
  id: string;
  tenant_id: string;
  code: string;
  label: string;
  label_translations: Record<string, string>;
  color: string;
  icon: string | null;
  description: string | null;
  type: ParcelStatusType;
  position: number;
  system_code: string | null;
  usage_count: number;
};

export async function listStatuses(
  tenantId: string,
  locale?: string,
): Promise<ParcelStatus[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("parcel_statuses")
    .select(
      "id, tenant_id, code, label, label_translations, color, icon, description, type, position, system_code",
    )
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  const statuses = (data ?? []) as Omit<ParcelStatus, "usage_count">[];

  const usage = new Map<string, number>();
  if (statuses.length > 0) {
    const { data: counts } = await admin
      .from("parcels")
      .select("status_id")
      .eq("tenant_id", tenantId);
    for (const r of counts ?? []) {
      const id = r.status_id as string | null;
      if (id) usage.set(id, (usage.get(id) ?? 0) + 1);
    }
  }

  return statuses.map((s) => {
    const translations = (s.label_translations ?? {}) as Record<string, string>;
    return {
      ...s,
      label: locale && translations[locale] ? translations[locale] : s.label,
      label_translations: translations,
      usage_count: usage.get(s.id) ?? 0,
    };
  });
}

export type ParcelListRow = {
  id: string;
  reference: string;
  client_id: string | null;
  client_name: string | null;
  status_id: string | null;
  status_label: string | null;
  status_color: string | null;
  status_type: ParcelStatusType | null;
  description: string | null;
  destination_country: string | null;
  estimated_delivery_at: string | null;
  transport_mode_id: string | null;
  transport_mode_label: string | null;
  is_client_initiated: boolean;
  created_at: string;
  updated_at: string;
};

export async function listParcels(
  tenantId: string,
  opts: { q?: string; statusId?: string; page?: number; pageSize?: number; locale?: string } = {},
): Promise<{ rows: ParcelListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createSupabaseAdmin();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, opts.pageSize ?? 25));

  let query = admin
    .from("parcels")
    .select(
      `id, reference, client_id, status_id, description, destination_country,
       estimated_delivery_at, transport_mode_id, is_client_initiated,
       created_at, updated_at,
       clients(full_name),
       parcel_statuses(label, label_translations, color, type),
       transport_modes(label, label_translations)`,
      { count: "exact" },
    )
    .eq("tenant_id", tenantId);

  if (opts.q) {
    const like = `%${opts.q.replace(/[%_]/g, "")}%`;
    query = query.ilike("reference", like);
  }
  if (opts.statusId) query = query.eq("status_id", opts.statusId);

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const locale = opts.locale;
  const rows: ParcelListRow[] = (data ?? []).map((r) => {
    const client = pickOne<{ full_name: string }>(r.clients);
    const status = pickOne<{
      label: string;
      label_translations: Record<string, string>;
      color: string;
      type: ParcelStatusType;
    }>(r.parcel_statuses);
    const mode = pickOne<{ label: string; label_translations: Record<string, string> }>(r.transport_modes);
    const statusLabel = status
      ? (locale && status.label_translations?.[locale]) || status.label
      : null;
    const modeLabel = mode
      ? (locale && mode.label_translations?.[locale]) || mode.label
      : null;
    return {
      id: r.id as string,
      reference: r.reference as string,
      client_id: (r.client_id as string | null) ?? null,
      client_name: client?.full_name ?? null,
      status_id: (r.status_id as string | null) ?? null,
      status_label: statusLabel,
      status_color: status?.color ?? null,
      status_type: status?.type ?? null,
      description: (r.description as string | null) ?? null,
      destination_country: (r.destination_country as string | null) ?? null,
      estimated_delivery_at: (r.estimated_delivery_at as string | null) ?? null,
      transport_mode_id: (r.transport_mode_id as string | null) ?? null,
      transport_mode_label: modeLabel,
      is_client_initiated: Boolean(r.is_client_initiated),
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
    };
  });

  return { rows, total: count ?? 0, page, pageSize };
}

export type ParcelDetail = {
  id: string;
  reference: string;
  client_id: string | null;
  client_name: string | null;
  status_id: string | null;
  description: string | null;
  weight_kg: number | null;
  volume_m3: number | null;
  estimated_price: number | null;
  currency: string | null;
  origin_country: string | null;
  destination_country: string | null;
  estimated_delivery_at: string | null;
  shipped_at: string | null;
  transport_mode_id: string | null;
  transport_mode_label: string | null;
  is_client_initiated: boolean;
  created_at: string;
};

export async function getParcel(
  tenantId: string,
  id: string,
  locale?: string,
): Promise<ParcelDetail | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("parcels")
    .select(
      `id, reference, client_id, status_id, description, weight_kg, volume_m3,
       estimated_price, currency, origin_country, destination_country,
       estimated_delivery_at, shipped_at, transport_mode_id, is_client_initiated,
       created_at,
       clients(full_name),
       transport_modes(label, label_translations)`,
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const client = pickOne<{ full_name: string }>(data.clients);
  const mode = pickOne<{ label: string; label_translations: Record<string, string> }>(data.transport_modes);
  const modeLabel = mode
    ? (locale && mode.label_translations?.[locale]) || mode.label
    : null;
  return {
    id: data.id as string,
    reference: data.reference as string,
    client_id: (data.client_id as string | null) ?? null,
    client_name: client?.full_name ?? null,
    status_id: (data.status_id as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    weight_kg: (data.weight_kg as number | null) ?? null,
    volume_m3: (data.volume_m3 as number | null) ?? null,
    estimated_price: (data.estimated_price as number | null) ?? null,
    currency: (data.currency as string | null) ?? null,
    origin_country: (data.origin_country as string | null) ?? null,
    destination_country: (data.destination_country as string | null) ?? null,
    estimated_delivery_at: (data.estimated_delivery_at as string | null) ?? null,
    shipped_at: (data.shipped_at as string | null) ?? null,
    transport_mode_id: (data.transport_mode_id as string | null) ?? null,
    transport_mode_label: modeLabel,
    is_client_initiated: Boolean(data.is_client_initiated),
    created_at: data.created_at as string,
  };
}

export async function updateStatusLabelTranslations(
  tenantId: string,
  id: string,
  translations: Record<string, string>,
): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("parcel_statuses")
    .update({ label_translations: translations })
    .eq("tenant_id", tenantId)
    .eq("id", id);
}

export async function insertParcelEvent(input: {
  tenantId: string;
  parcelId: string;
  statusId: string | null;
  comment: string | null;
  actorId: string | null;
  actorEmail: string | null;
}): Promise<void> {
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("parcel_events").insert({
    tenant_id: input.tenantId,
    parcel_id: input.parcelId,
    status_id: input.statusId,
    comment: input.comment,
    actor_id: input.actorId,
    actor_email: input.actorEmail,
  });
  if (error) throw new Error(error.message);
}

export type ParcelEvent = {
  id: string;
  status_id: string | null;
  status_label: string | null;
  status_color: string | null;
  comment: string | null;
  occurred_at: string;
  actor_email: string | null;
};

export async function listParcelEvents(
  parcelId: string,
  locale?: string,
): Promise<ParcelEvent[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("parcel_events")
    .select(
      `id, status_id, comment, occurred_at, actor_email,
       parcel_statuses(label, label_translations, color)`,
    )
    .eq("parcel_id", parcelId)
    .order("occurred_at", { ascending: false });

  return (data ?? []).map((r) => {
    const status = pickOne<{ label: string; label_translations: Record<string, string>; color: string }>(r.parcel_statuses);
    const statusLabel = status
      ? (locale && status.label_translations?.[locale]) || status.label
      : null;
    return {
      id: r.id as string,
      status_id: (r.status_id as string | null) ?? null,
      status_label: statusLabel,
      status_color: status?.color ?? null,
      comment: (r.comment as string | null) ?? null,
      occurred_at: r.occurred_at as string,
      actor_email: (r.actor_email as string | null) ?? null,
    };
  });
}

export type TransportMode = { id: string; label: string };

export async function listTransportModes(
  tenantId: string,
): Promise<TransportMode[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("transport_modes")
    .select("id, label")
    .eq("tenant_id", tenantId)
    .order("label", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id as string,
    label: r.label as string,
  }));
}

export async function listClientsForTenant(
  tenantId: string,
): Promise<{ id: string; full_name: string; email: string | null }[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("clients")
    .select("id, full_name, email")
    .eq("tenant_id", tenantId)
    .order("full_name", { ascending: true })
    .limit(500);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    full_name: r.full_name as string,
    email: (r.email as string | null) ?? null,
  }));
}
