import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { ResetPasswordForm } from "./_form";

type Props = { params: Promise<{ subdomain: string }> };

export default async function TenantResetPasswordPage({ params }: Props) {
  const { subdomain } = await params;

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") redirect("/");
  if (tenant.status === "suspended") redirect("/suspended");

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

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
          <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Définissez un nouveau mot de passe pour votre espace {tenant.name}.
          </p>
        </div>
        <ResetPasswordForm subdomain={subdomain} />
      </div>
    </main>
  );
}
