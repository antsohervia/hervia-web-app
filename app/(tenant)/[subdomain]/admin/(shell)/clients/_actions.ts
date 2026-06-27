"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  requireTenantAdmin,
  assertNotImpersonatingTenant,
} from "@/lib/auth/tenant-dal";
import { env, isProduction } from "@/lib/env";
import {
  getClientById,
  getClientByEmailAndTenant,
  createClientAdmin,
} from "@/lib/clients/repo";
import {
  CreateClientSchema,
  GenerateRecoveryLinkSchema,
  type CreateClientState,
  type GenerateRecoveryLinkState,
} from "@/lib/validations/client-admin";

function tenantOrigin(subdomain: string): string {
  return isProduction()
    ? `https://${subdomain}.${env.appDomain}`
    : `http://${subdomain}.${env.devHost}`;
}

export async function createClientAction(
  _prev: CreateClientState | undefined,
  formData: FormData,
): Promise<CreateClientState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = CreateClientSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return { errors: tree.fieldErrors as CreateClientState["errors"] };
  }

  const { fullName, email, phone } = parsed.data;

  const existing = await getClientByEmailAndTenant(email, session.tenant.id);
  if (existing) {
    return { errors: { email: ["Un client avec cet email existe déjà"] } };
  }

  await createClientAdmin(session.tenant.id, {
    full_name: fullName,
    email,
    phone,
  });

  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function generateRecoveryLinkAction(
  _prev: GenerateRecoveryLinkState | undefined,
  formData: FormData,
): Promise<GenerateRecoveryLinkState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = GenerateRecoveryLinkSchema.safeParse({
    clientId: formData.get("clientId"),
  });
  if (!parsed.success) {
    return { errors: { _form: ["Paramètres invalides"] } };
  }

  const client = await getClientById(parsed.data.clientId);
  if (!client || client.tenant_id !== session.tenant.id) {
    return { errors: { _form: ["Client introuvable"] } };
  }
  if (!client.user_id) {
    return {
      errors: {
        _form: [
          "Ce client n'a pas encore de compte. Il doit d'abord s'inscrire.",
        ],
      },
    };
  }
  if (!client.email) {
    return { errors: { _form: ["Ce client n'a pas d'email enregistré."] } };
  }

  const admin = createSupabaseAdmin();
  const callbackUrl = `${tenantOrigin(subdomain)}/auth/callback`;

  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "recovery",
      email: client.email,
      options: { redirectTo: callbackUrl },
    });

  if (linkErr || !linkData?.properties?.hashed_token) {
    return {
      errors: {
        _form: [
          `Échec de la génération: ${linkErr?.message ?? "erreur inconnue"}`,
        ],
      },
    };
  }

  const recoveryLink = `${callbackUrl}?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;

  return { ok: true, recoveryLink, clientEmail: client.email };
}
