import { redirect } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { ClientSignupForm } from "./_signup-form";
import { ClientAuthShell } from "../_auth-shell";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function ClientSignupPage({ params }: Props) {
  const { subdomain } = await params;

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") redirect("/");
  if (tenant.status === "suspended") redirect("/suspended");

  return (
    <ClientAuthShell
      tenant={tenant}
      title="Créer votre compte"
      subtitle={`Rejoignez l'espace de suivi ${tenant.name} en quelques secondes.`}
      highlight={`Rejoignez l'espace ${tenant.name} et gardez un œil sur vos colis.`}
    >
      <ClientSignupForm subdomain={subdomain} tenantName={tenant.name} />
    </ClientAuthShell>
  );
}
