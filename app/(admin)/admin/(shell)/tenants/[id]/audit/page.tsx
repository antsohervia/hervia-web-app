import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenant } from "@/lib/tenants/repo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TenantAuditPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  const admin = createSupabaseAdmin();
  const { data: logs } = await admin
    .from("audit_logs")
    .select("id, action, actor_email, payload, created_at")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/admin/tenants/${id}`}>
          <ArrowLeft className="size-4 mr-1" />
          Retour
        </Link>
      </Button>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {"Journal d'audit"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tenant : <code>{tenant.subdomain}</code>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/audit?tenantId=${id}`}>
            Voir le journal global
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Acteur</TableHead>
              <TableHead>Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs ?? []).map((l) => (
              <TableRow key={l.id as string}>
                <TableCell className="text-xs whitespace-nowrap">
                  {new Date(l.created_at as string).toLocaleString("fr-FR")}
                </TableCell>
                <TableCell>
                  <code className="text-xs">{l.action as string}</code>
                </TableCell>
                <TableCell className="text-sm">
                  {(l.actor_email as string | null) ?? "—"}
                </TableCell>
                <TableCell>
                  <pre className="text-xs text-muted-foreground max-w-md whitespace-pre-wrap break-all">
                    {JSON.stringify(l.payload, null, 2)}
                  </pre>
                </TableCell>
              </TableRow>
            ))}
            {(logs ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  {"Aucune entrée d'audit."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
