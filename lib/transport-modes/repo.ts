import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getFinalStatusIds(
  admin: SupabaseClient,
  tenantId: string,
): Promise<string[]> {
  const { data } = await admin
    .from("parcel_statuses")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("type", "final");
  return (data ?? []).map((r) => r.id as string);
}

export type TransportMode = {
  id: string;
  tenant_id: string;
  code: string;
  label: string;
  label_translations: Record<string, string>;
  position: number;
  usage_count: number;
};

export async function listTransportModes(
  tenantId: string,
  locale?: string,
): Promise<TransportMode[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("transport_modes")
    .select("id, tenant_id, code, label, label_translations, position")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  const modes = (data ?? []) as Omit<TransportMode, "usage_count">[];

  const usage = new Map<string, number>();
  if (modes.length > 0) {
    const finalIds = await getFinalStatusIds(admin, tenantId);
    let q = admin
      .from("parcels")
      .select("transport_mode_id")
      .eq("tenant_id", tenantId)
      .not("transport_mode_id", "is", null);
    if (finalIds.length > 0)
      q = q.or(`status_id.is.null,status_id.not.in.(${finalIds.join(",")})`);
    const { data: rows } = await q;
    for (const r of rows ?? []) {
      const id = r.transport_mode_id as string | null;
      if (id) usage.set(id, (usage.get(id) ?? 0) + 1);
    }
  }

  return modes.map((m) => {
    const translations = (m.label_translations ?? {}) as Record<string, string>;
    return {
      ...m,
      label: locale && translations[locale] ? translations[locale] : m.label,
      label_translations: translations,
      usage_count: usage.get(m.id) ?? 0,
    };
  });
}

export async function getTransportMode(
  tenantId: string,
  id: string,
): Promise<TransportMode | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("transport_modes")
    .select("id, tenant_id, code, label, position")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { ...(data as Omit<TransportMode, "usage_count">), usage_count: 0 };
}

export async function createTransportMode(
  tenantId: string,
  input: { code: string; label: string },
): Promise<{ id: string }> {
  const admin = createSupabaseAdmin();
  const { data: maxRow } = await admin
    .from("transport_modes")
    .select("position")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((maxRow?.position as number | undefined) ?? 0) + 10;

  const { data, error } = await admin
    .from("transport_modes")
    .insert({
      tenant_id: tenantId,
      code: input.code,
      label: input.label,
      position: nextPosition,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export async function updateTransportMode(
  tenantId: string,
  id: string,
  input: { code: string; label: string },
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("transport_modes")
    .update({ code: input.code, label: input.label })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTransportMode(
  tenantId: string,
  id: string,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const finalIds = await getFinalStatusIds(admin, tenantId);
  let activeQuery = admin
    .from("parcels")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("transport_mode_id", id);
  if (finalIds.length > 0)
    activeQuery = activeQuery.or(
      `status_id.is.null,status_id.not.in.(${finalIds.join(",")})`,
    );
  const { count } = await activeQuery;
  if ((count ?? 0) > 0) {
    throw new Error(
      "Mode utilisé par au moins un colis en cours — suppression impossible",
    );
  }
  const { error } = await admin
    .from("transport_modes")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateTransportModeLabelTranslations(
  tenantId: string,
  id: string,
  translations: Record<string, string>,
): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("transport_modes")
    .update({ label_translations: translations })
    .eq("tenant_id", tenantId)
    .eq("id", id);
}

export async function reorderTransportModes(
  tenantId: string,
  orderedIds: string[],
): Promise<void> {
  const admin = createSupabaseAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await admin
      .from("transport_modes")
      .update({ position: (i + 1) * 10 })
      .eq("tenant_id", tenantId)
      .eq("id", orderedIds[i]);
    if (error) throw new Error(error.message);
  }
}
