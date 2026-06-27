import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requestOrigin } from "@/lib/auth/callback-url";
import {
  activateClient,
  touchClientLastLogin,
  getClientByEmailAndTenant,
  createClientFromOAuth,
  linkClientToUser,
} from "@/lib/clients/repo";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ subdomain: string }> },
) {
  const { subdomain } = await context.params;
  const origin = requestOrigin(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createSupabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=callback", origin));
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      console.error("[auth/callback] verifyOtp failed", { token_hash, type, error: error.message, code: error.code });
      return NextResponse.redirect(new URL("/login?error=callback", origin));
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const admin = createSupabaseAdmin();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, status")
    .eq("subdomain", subdomain)
    .maybeSingle();
  if (!tenant || tenant.status === "deleted") {
    return NextResponse.redirect(new URL("/", origin));
  }

  const isAdminContext = next?.startsWith("/admin") ?? false;

  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Branche tenant-admin : si membre du tenant, suit le flux historique.
  if (member) {
    const hasOAuthIdentity = (user.identities ?? []).some(
      (identity) => identity.provider !== "email",
    );
    const currentMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const intendedRole = currentMeta.intended_role;
    const newMeta = { ...currentMeta };
    let metaChanged = false;

    // Onboarding finalisé via OAuth linking : on retire l'intended_role.
    if (intendedRole && hasOAuthIdentity) {
      delete newMeta.intended_role;
      metaChanged = true;
    }

    // Première liaison OAuth ou premier login : on copie le nom fourni par le
    // provider (Google : `full_name`/`name`) dans notre clé `display_name`
    // qu'on contrôle. On ne le fait qu'une fois pour ne pas écraser une
    // édition manuelle ultérieure de l'utilisateur.
    const hasDisplayName =
      typeof newMeta.display_name === "string" &&
      newMeta.display_name.trim().length > 0;
    if (!hasDisplayName) {
      const providerName =
        typeof newMeta.full_name === "string"
          ? newMeta.full_name
          : typeof newMeta.name === "string"
            ? newMeta.name
            : null;
      if (providerName?.trim()) {
        newMeta.display_name = providerName.trim();
        metaChanged = true;
      }
    }

    if (metaChanged) {
      await admin.auth.admin.updateUserById(user.id, { user_metadata: newMeta });
    }

    const stillNeedsSetup = Boolean(intendedRole) && !hasOAuthIdentity;
    const target = next ?? (stillNeedsSetup ? "/admin/setup" : "/admin");
    return NextResponse.redirect(new URL(target, origin));
  }

  // Login admin via OAuth pour un compte non rattaché au tenant : on coupe ici
  // pour éviter de basculer sur la branche client et donner un message clair.
  if (isAdminContext) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?error=no_link", origin),
    );
  }

  // Branche client : activation post-confirmation email + redirect dashboard.
  const { data: client } = await admin
    .from("clients")
    .select("id, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) {
    // Flux OAuth : liaison par email ou auto-inscription.
    if (code && user.email) {
      const byEmail = await getClientByEmailAndTenant(user.email, tenant.id);
      if (byEmail) {
        if (byEmail.status === "disabled") {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            new URL("/login?error=disabled", origin),
          );
        }
        if (byEmail.user_id === null) {
          await linkClientToUser(byEmail.id, user.id);
          await touchClientLastLogin(byEmail.id);
          return NextResponse.redirect(new URL(next ?? "/", origin));
        }
      } else {
        // Nouvel utilisateur Google : auto-inscription.
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const fullName =
          typeof meta.full_name === "string" && meta.full_name.trim()
            ? meta.full_name.trim()
            : typeof meta.name === "string" && meta.name.trim()
              ? meta.name.trim()
              : user.email;
        const newClient = await createClientFromOAuth(
          tenant.id,
          user.id,
          fullName,
          user.email,
        );
        await touchClientLastLogin(newClient.id);
        return NextResponse.redirect(new URL(next ?? "/", origin));
      }
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=callback", origin));
  }

  if (client.status === "disabled") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=disabled", origin));
  }

  if (client.status === "pending_activation") {
    await activateClient(client.id as string);
  }

  await touchClientLastLogin(client.id as string);

  return NextResponse.redirect(new URL(next ?? "/", origin));
}
