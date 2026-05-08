import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenants/repo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ subdomain: string }>;
};

export default async function TenantHomePage({ params }: Props) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-3">
        <h1 className="text-3xl font-semibold">Bienvenue chez {tenant.name}</h1>
        <p className="text-muted-foreground">
          {"Cet espace est en cours de configuration. L'équipe "}
          {tenant.name}
          {" finalise prochainement la mise en service."}
        </p>
        <p className="text-xs text-muted-foreground">
          Sous-domaine : <code>{tenant.subdomain}</code> · Devise par défaut :{" "}
          <code>{tenant.default_currency}</code>
        </p>
      </div>
    </main>
  );
}
