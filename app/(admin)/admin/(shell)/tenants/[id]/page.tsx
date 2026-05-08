import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTenant } from "@/lib/tenants/repo";
import { SUSPENSION_REASON_LABELS } from "@/lib/validations/tenant";
import { env, isProduction } from "@/lib/env";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import { canManageTenants } from "@/lib/auth/roles";
import { SuspendDialog } from "../_components/suspend-dialog";
import { DeleteDialog } from "../_components/delete-dialog";
import { ReactivateButton } from "../_components/reactivate-button";
import { ImpersonateButton } from "../_components/impersonate-button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TenantDetailPage({ params }: Props) {
  const session = await requirePlatformAdmin();
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();
  const canManage = canManageTenants(session.role);

  const tenantUrl = isProduction()
    ? `https://${tenant.subdomain}.${env.appDomain}`
    : `http://${tenant.subdomain}.${env.devHost}`;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/tenants">
          <ArrowLeft className="size-4 mr-1" />
          Retour à la liste
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{tenant.name}</h1>
            <StatusBadge status={tenant.status} />
          </div>
          <a
            href={tenantUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:underline mt-1 inline-block"
          >
            {tenantUrl}
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && tenant.status !== "deleted" ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/tenants/${tenant.id}/edit`}>
                <Pencil className="size-4 mr-1" />
                Modifier
              </Link>
            </Button>
          ) : null}
          <ImpersonateButton
            tenantId={tenant.id}
            disabled={tenant.status === "deleted"}
          />
          {canManage && tenant.status === "active" ? (
            <SuspendDialog tenantId={tenant.id} />
          ) : null}
          {canManage && tenant.status === "suspended" ? (
            <ReactivateButton tenantId={tenant.id} />
          ) : null}
          {canManage ? (
            <DeleteDialog
              tenantId={tenant.id}
              subdomain={tenant.subdomain}
              status={tenant.status}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>Détails du tenant</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <Row label="Sous-domaine" value={tenant.subdomain} />
            <Row label="Pays" value={tenant.country} />
            <Row label="Devise" value={tenant.default_currency} />
            <Row label="Fuseau horaire" value={tenant.timezone} />
            <Row
              label="Créé le"
              value={new Date(tenant.created_at).toLocaleString("fr-FR")}
            />
            <Row
              label="Mise à jour"
              value={new Date(tenant.updated_at).toLocaleString("fr-FR")}
            />
          </CardContent>
        </Card>

        {tenant.status === "suspended" ? (
          <Card>
            <CardHeader>
              <CardTitle>Suspension</CardTitle>
              <CardDescription>État de suspension actif</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <Row
                label="Motif"
                value={
                  SUSPENSION_REASON_LABELS[
                    tenant.suspension_reason as keyof typeof SUSPENSION_REASON_LABELS
                  ] ?? tenant.suspension_reason ?? "—"
                }
              />
              <Row
                label="Date"
                value={
                  tenant.suspended_at
                    ? new Date(tenant.suspended_at).toLocaleString("fr-FR")
                    : "—"
                }
              />
              {tenant.suspension_note ? (
                <div>
                  <p className="text-muted-foreground text-xs">Note interne</p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {tenant.suspension_note}
                  </p>
                </div>
              ) : null}
              {tenant.suspension_message ? (
                <div>
                  <p className="text-muted-foreground text-xs">
                    Message public
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {tenant.suspension_message}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Separator className="my-6" />

      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/tenants/${tenant.id}/audit`}>
          {"Voir le journal d'audit"}
        </Link>
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "suspended" | "deleted" }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200"
      >
        Actif
      </Badge>
    );
  }
  if (status === "suspended") {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200"
      >
        Suspendu
      </Badge>
    );
  }
  return <Badge variant="secondary">Supprimé</Badge>;
}
