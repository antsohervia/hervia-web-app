import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { ClientLoginForm } from "./_login-form";
import { ClientAuthShell } from "../_auth-shell";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ClientLoginPage({ params, searchParams }: Props) {
  const { subdomain } = await params;
  const { error } = await searchParams;

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") redirect("/");
  if (tenant.status === "suspended") redirect("/suspended");

  // Si déjà connecté en tant que client de ce tenant : redirect vers dashboard.
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createSupabaseAdmin();
    const { data: client } = await admin
      .from("clients")
      .select("id, status")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (client && client.status === "active") {
      redirect("/");
    }
  }

  return (
    <ClientAuthShell
      tenant={tenant}
      title={`Bienvenue chez ${tenant.name}`}
      subtitle="Connectez-vous pour suivre vos expéditions."
      highlight={`L'espace de suivi de ${tenant.name}, à votre service.`}
    >
      <ClientLoginForm subdomain={subdomain} initialError={error} />
    </ClientAuthShell>
  );
}
