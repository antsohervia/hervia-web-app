import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenant } from "@/lib/tenants/repo";
import { EditTenantForm } from "../../_components/edit-tenant-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTenantPage({ params }: Props) {
  await requireSuperAdmin();
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  const admin = createSupabaseAdmin();
  const { data: member } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", id)
    .eq("role", "entreprise_admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let adminEmail = "";
  if (member?.user_id) {
    const { data } = await admin.auth.admin.getUserById(
      member.user_id as string,
    );
    adminEmail = data?.user?.email ?? "";
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/admin/tenants/${tenant.id}`}>
          <ArrowLeft className="size-4 mr-1" />
          Retour
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold mb-1">Modifier le tenant</h1>
      <p className="text-sm text-muted-foreground mb-6">
        <code>{tenant.subdomain}</code>
      </p>

      <EditTenantForm
        tenant={{
          id: tenant.id,
          subdomain: tenant.subdomain,
          name: tenant.name,
          adminEmail,
          country: tenant.country,
          defaultCurrency: tenant.default_currency,
          timezone: tenant.timezone,
          status: tenant.status,
        }}
      />
    </div>
  );
}
