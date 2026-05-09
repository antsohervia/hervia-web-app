import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { LoginForm } from "./_login-form";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function TenantLoginPage({
  params,
  searchParams,
}: Props) {
  const { subdomain } = await params;
  const { error } = await searchParams;

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") redirect("/");
  if (tenant.status === "suspended") redirect("/suspended");

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createSupabaseAdmin();
    const { data: member } = await admin
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (member) redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="mx-auto h-12 w-auto mb-3 object-contain"
            />
          ) : null}
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Espace d&apos;administration
          </p>
        </div>
        <LoginForm subdomain={subdomain} initialError={error} />
      </div>
    </main>
  );
}
