import { NextResponse, type NextRequest } from "next/server";
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
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=callback", origin));
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

  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Branche tenant-admin : si membre du tenant, suit le flux historique.
  if (member) {
    const target =
      next ?? (user.user_metadata?.intended_role ? "/admin/setup" : "/admin");
    return NextResponse.redirect(new URL(target, origin));
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
