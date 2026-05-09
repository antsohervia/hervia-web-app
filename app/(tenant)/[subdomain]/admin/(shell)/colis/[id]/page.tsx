import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import {
  getParcel,
  listParcelEvents,
  listStatuses,
} from "@/lib/parcels/repo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangeStatusCard } from "../_change-status-card";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateOnlyFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" });

type Props = {
  params: Promise<{ subdomain: string; id: string }>;
};

export default async function ParcelDetailPage({ params }: Props) {
  const { subdomain, id } = await params;
  const session = await requireTenantSession(subdomain);

  const parcel = await getParcel(session.tenant.id, id);
  if (!parcel) notFound();

  const [statuses, events] = await Promise.all([
    listStatuses(session.tenant.id),
    listParcelEvents(parcel.id),
  ]);

  const currentStatus = statuses.find((s) => s.id === parcel.status_id) ?? null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/colis">
            <ArrowLeft className="size-4 mr-1" />
            Retour
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold break-words">
            {parcel.reference}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Client : {parcel.client_name ?? "non assigné"} · Créé le{" "}
            {dateFmt.format(new Date(parcel.created_at))}
          </p>
        </div>
        {currentStatus ? (
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ background: currentStatus.color }}
          >
            {currentStatus.label}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Description" value={parcel.description} />
            <Row
              label="Poids"
              value={parcel.weight_kg ? `${parcel.weight_kg} kg` : null}
            />
            <Row
              label="Volume"
              value={parcel.volume_m3 ? `${parcel.volume_m3} m³` : null}
            />
            <Row
              label="Estimation"
              value={
                parcel.estimated_price
                  ? `${parcel.estimated_price.toLocaleString("fr-FR")} ${
                      parcel.currency ?? ""
                    }`
                  : null
              }
            />
            <Row label="Origine" value={parcel.origin_country} />
            <Row label="Destination" value={parcel.destination_country} />
            <Row
              label="Expédié le"
              value={
                parcel.shipped_at
                  ? dateFmt.format(new Date(parcel.shipped_at))
                  : null
              }
            />
            <Row
              label="Livraison estimée"
              value={
                parcel.estimated_delivery_at
                  ? dateOnlyFmt.format(new Date(parcel.estimated_delivery_at))
                  : null
              }
            />
            {parcel.estimated_price ? (
              <p className="text-xs text-muted-foreground italic pt-2">
                L&apos;estimation de prix est indicative et non contractuelle.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4 sm:space-y-6">
          <ChangeStatusCard
            subdomain={subdomain}
            parcelId={parcel.id}
            currentStatusId={parcel.status_id}
            currentStatusType={currentStatus?.type ?? null}
            statuses={statuses.map((s) => ({
              id: s.id,
              label: s.label,
              color: s.color,
              type: s.type,
            }))}
            canReopen={session.role === "entreprise_admin"}
          />

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun évènement enregistré.
                </p>
              ) : (
                <ol className="relative border-l ml-2 space-y-4">
                  {events.map((e) => (
                    <li key={e.id} className="ml-4">
                      <span
                        className="absolute -left-1.5 size-3 rounded-full border-2 border-background"
                        style={{
                          background: e.status_color ?? "#6B7280",
                        }}
                      />
                      <p className="text-sm font-medium">
                        {e.status_label ?? "Évènement"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateFmt.format(new Date(e.occurred_at))}
                        {e.actor_email ? ` · ${e.actor_email}` : ""}
                      </p>
                      {e.comment ? (
                        <p className="text-sm mt-1">{e.comment}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? "—"}</span>
    </div>
  );
}
