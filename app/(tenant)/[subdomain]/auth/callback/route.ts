import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requestOrigin } from "@/lib/auth/callback-url";
import { activateClient, touchClientLastLogin } from "@/lib/clients/repo";

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
      return NextResponse.redirect(new URL("/login?error=callback", origin));
    }
  } else {
    return NextResponse.redirect(new URL("/login", origin));
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
    const intendedRole = user.user_metadata?.intended_role;

    // Onboarding finalisé via OAuth linking : on retire l'intended_role.
    if (intendedRole && hasOAuthIdentity) {
      const newMeta = { ...(user.user_metadata ?? {}) };
      delete newMeta.intended_role;
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
