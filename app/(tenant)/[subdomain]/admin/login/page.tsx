import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { BrandedAuthShell } from "../_branded-auth-shell";
import { LoginForm } from "./_login-form";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  const name = tenant?.name ?? "Admin";
  return { title: `${name} — Connexion` };
}

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
    <BrandedAuthShell tenant={tenant}>
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
    </BrandedAuthShell>
  );
}
