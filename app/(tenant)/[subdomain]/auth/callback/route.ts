import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requestOrigin } from "@/lib/auth/callback-url";

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
    return NextResponse.redirect(new URL("/admin/login", origin));
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL("/admin/login?error=callback", origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", origin));
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
  if (!member) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?error=forbidden", origin),
    );
  }

  // Si `next` est explicitement fourni (ex: lien de reset password), on l'honore.
  // Sinon, fallback vers /admin/setup pour les invités non activés, ou /admin.
  const target =
    next ?? (user.user_metadata?.intended_role ? "/admin/setup" : "/admin");
  return NextResponse.redirect(new URL(target, origin));
}
