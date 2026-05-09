import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { ClientResetPasswordForm } from "./_form";
import { ClientAuthShell } from "../_auth-shell";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function ClientResetPasswordPage({ params }: Props) {
  const { subdomain } = await params;

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") redirect("/");
  if (tenant.status === "suspended") redirect("/suspended");

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ClientAuthShell
      tenant={tenant}
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe pour sécuriser votre espace."
    >
      <ClientResetPasswordForm subdomain={subdomain} />
    </ClientAuthShell>
  );
}
