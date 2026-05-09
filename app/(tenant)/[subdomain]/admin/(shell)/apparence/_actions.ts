"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  requireTenantAdmin,
  assertNotImpersonatingTenant,
  type TenantSession,
} from "@/lib/auth/tenant-dal";
import {
  LOGO_ACCEPTED_MIME,
  LOGO_MAX_BYTES,
  PublishThemeSchema,
  type LogoState,
  type PublishThemeState,
} from "@/lib/validations/branding";

const LOGO_BUCKET = "tenant-assets";

async function logTenantAudit(
  client: SupabaseClient,
  session: TenantSession,
  action: string,
  payload: Record<string, unknown>,
) {
  await client.from("audit_logs").insert({
    actor_id: session.userId === "impersonation" ? null : session.userId,
    actor_email: session.email,
    action,
    tenant_id: session.tenant.id,
    payload,
  });
}

async function snapshotHistory(tenantId: string, userId: string) {
  const admin = createSupabaseAdmin();
  const { data: tenant } = await admin
    .from("tenants")
    .select("theme, primary_color, secondary_color, logo_url")
    .eq("id", tenantId)
    .single();
  if (!tenant) return;
  await admin.from("tenant_theme_history").insert({
    tenant_id: tenantId,
    theme: tenant.theme,
    primary_color: tenant.primary_color,
    secondary_color: tenant.secondary_color,
    logo_url: tenant.logo_url,
    published_by: userId === "impersonation" ? null : userId,
  });
}

export async function uploadLogoAction(
  _prev: LogoState | undefined,
  formData: FormData,
): Promise<LogoState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Aucun fichier fourni" };
  }
  if (file.size > LOGO_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return { error: `Fichier trop lourd (${mb} Mo). Maximum 2 Mo.` };
  }
  if (!(LOGO_ACCEPTED_MIME as readonly string[]).includes(file.type)) {
    return { error: "Format non supporté. Acceptés : PNG, JPG, SVG." };
  }

  const ext =
    file.type === "image/svg+xml"
      ? "svg"
      : file.type === "image/png"
        ? "png"
        : "jpg";
  const path = `${session.tenant.id}/logo-${Date.now()}.${ext}`;

  const admin = createSupabaseAdmin();
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, buf, {
      contentType: file.type,
      upsert: true,
    });
  if (upErr) return { error: upErr.message };

  const { data: pub } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: updErr } = await admin
    .from("tenants")
    .update({ logo_url: url })
    .eq("id", session.tenant.id);
  if (updErr) return { error: updErr.message };

  await logTenantAudit(admin, session, "tenant.logo.update", {
    path,
    size: file.size,
    mime: file.type,
  });

  revalidatePath(`/${subdomain}/admin/apparence`);
  revalidatePath(`/${subdomain}`);
  return { ok: true };
}

export async function resetLogoAction(formData: FormData): Promise<void> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const admin = createSupabaseAdmin();
  await admin
    .from("tenants")
    .update({ logo_url: null })
    .eq("id", session.tenant.id);

  await logTenantAudit(admin, session, "tenant.logo.reset", {});

  revalidatePath(`/${subdomain}/admin/apparence`);
  revalidatePath(`/${subdomain}`);
}

export async function publishThemeAction(
  _prev: PublishThemeState | undefined,
  formData: FormData,
): Promise<PublishThemeState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = PublishThemeSchema.safeParse({
    theme: formData.get("theme"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor") || undefined,
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as PublishThemeState["errors"] };
  }

  await snapshotHistory(session.tenant.id, session.userId);

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("tenants")
    .update({
      theme: parsed.data.theme,
      primary_color: parsed.data.primaryColor,
      secondary_color: parsed.data.secondaryColor || null,
    })
    .eq("id", session.tenant.id);
  if (error) return { errors: { _form: [error.message] } };

  await logTenantAudit(admin, session, "tenant.theme.publish", parsed.data);

  revalidatePath(`/${subdomain}/admin/apparence`);
  revalidatePath(`/${subdomain}`);
  return { ok: true };
}

export async function restoreThemeAction(formData: FormData): Promise<void> {
  const subdomain = String(formData.get("subdomain") ?? "");
  const historyId = String(formData.get("historyId") ?? "");
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const admin = createSupabaseAdmin();
  const { data: entry } = await admin
    .from("tenant_theme_history")
    .select("theme, primary_color, secondary_color, logo_url")
    .eq("tenant_id", session.tenant.id)
    .eq("id", historyId)
    .maybeSingle();
  if (!entry) throw new Error("Entrée d'historique introuvable");

  await snapshotHistory(session.tenant.id, session.userId);

  const { error } = await admin
    .from("tenants")
    .update({
      theme: entry.theme,
      primary_color: entry.primary_color,
      secondary_color: entry.secondary_color,
      logo_url: entry.logo_url,
    })
    .eq("id", session.tenant.id);
  if (error) throw new Error(error.message);

  await logTenantAudit(admin, session, "tenant.theme.restore", {
    history_id: historyId,
  });

  revalidatePath(`/${subdomain}/admin/apparence`);
  revalidatePath(`/${subdomain}`);
}
