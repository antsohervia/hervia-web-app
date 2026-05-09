import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requestOrigin } from "@/lib/auth/callback-url";

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const target = searchParams.get("next") ?? "/admin/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login", origin));
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/admin/login?error=callback", origin),
    );
  }

  const role = data.user.app_metadata?.role as string | undefined;
  if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?error=forbidden", origin),
    );
  }

  return NextResponse.redirect(new URL(target, origin));
}
