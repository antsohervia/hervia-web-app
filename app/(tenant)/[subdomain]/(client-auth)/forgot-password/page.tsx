import { redirect } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { ClientForgotPasswordForm } from "./_form";
import { ClientAuthShell } from "../_auth-shell";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function ClientForgotPasswordPage({ params }: Props) {
  const { subdomain } = await params;

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") redirect("/");
  if (tenant.status === "suspended") redirect("/suspended");

  return (
    <ClientAuthShell
      tenant={tenant}
      title="Mot de passe oublié"
      subtitle="Saisissez votre email : nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe."
    >
      <ClientForgotPasswordForm subdomain={subdomain} />
    </ClientAuthShell>
  );
}
