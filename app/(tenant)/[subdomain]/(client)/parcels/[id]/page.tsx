import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2 } from "lucide-react";
import { getLocale } from "next-intl/server";
import { requireClientSession } from "@/lib/auth/client-dal";
import { getClientParcelDetail } from "@/lib/clients/repo";
import { listParcelEvents, listStatuses } from "@/lib/parcels/repo";
import { getClientBrand } from "@/lib/branding/client-theme";
import { Button } from "@/components/ui/button";
import { RealtimeParcelRefresh } from "./_realtime-parcel-refresh";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});
const dateOnlyFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

type Props = {
  params: Promise<{ subdomain: string; id: string }>;
};

export default async function ClientParcelDetailPage({ params }: Props) {
  const { subdomain, id } = await params;
  const session = await requireClientSession(subdomain);
  const brand = getClientBrand(session.tenant);
  const locale = await getLocale();

  const parcel = await getClientParcelDetail(
    id,
    session.clientId,
    session.tenant.id,
    locale,
  );
  if (!parcel) notFound();

  const [statuses, events] = await Promise.all([
    listStatuses(session.tenant.id, locale),
    listParcelEvents(parcel.id, locale),
  ]);

  const currentStatus = statuses.find((s) => s.id === parcel.status_id) ?? null;
  const isFinal = currentStatus?.type === "final";
  const statusColor = currentStatus?.color ?? brand.primary;

  const reachedStatusIds = new Set(
    events.map((e) => e.status_id).filter((x): x is string => !!x),
  );
  const currentIndex = currentStatus
    ? statuses.findIndex((s) => s.id === currentStatus.id)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <RealtimeParcelRefresh parcelId={parcel.id} />
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="size-4 mr-1" />
          Retour à mes expéditions
        </Link>
      </Button>

      <section
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{
          borderColor: brand.palette.border,
          background: `linear-gradient(135deg, color-mix(in srgb, ${brand.primary} 15%, ${brand.palette.card}) 0%, ${brand.palette.card} 65%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute -top-20 -right-16 size-64 rounded-full opacity-25"
          style={{ background: brand.primary, filter: "blur(70px)" }}
        />
        <div className="relative">
          <p
            className="text-xs uppercase tracking-[0.18em] font-semibold"
            style={{ color: brand.primary }}
          >
            Suivi d&apos;expédition
          </p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {parcel.reference}
              </h1>
              {parcel.description ? (
                <p
                  className="text-sm mt-1.5 max-w-xl"
                  style={{ color: brand.palette.muted }}
                >
                  {parcel.description}
                </p>
              ) : null}
            </div>
            {currentStatus ? (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium shrink-0"
                style={{
                  background: `color-mix(in srgb, ${statusColor} 18%, transparent)`,
                  color: statusColor,
                  border: `1px solid color-mix(in srgb, ${statusColor} 40%, transparent)`,
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: statusColor }}
                />
                {currentStatus.label}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {parcel.estimated_delivery_at && !isFinal ? (
              <InfoTile
                icon={<CalendarClock className="size-4" />}
                label="Livraison estimée"
                value={dateOnlyFmt.format(
                  new Date(parcel.estimated_delivery_at),
                )}
                tint={`color-mix(in srgb, ${brand.primary} 12%, transparent)`}
                border={`color-mix(in srgb, ${brand.primary} 30%, ${brand.palette.border})`}
                accent={brand.primary}
                muted={brand.palette.muted}
              />
            ) : null}
            {isFinal ? (
              <InfoTile
                icon={<CheckCircle2 className="size-4" />}
                label="Statut"
                value="Expédition livrée"
                tint={`color-mix(in srgb, ${statusColor} 12%, transparent)`}
                border={`color-mix(in srgb, ${statusColor} 30%, ${brand.palette.border})`}
                accent={statusColor}
                muted={brand.palette.muted}
              />
            ) : null}
            {parcel.origin_country || parcel.destination_country ? (
              <InfoTile
                label="Itinéraire"
                value={[parcel.origin_country, parcel.destination_country]
                  .filter(Boolean)
                  .join(" → ") || "—"}
                tint={brand.palette.cardElevated}
                border={brand.palette.border}
                muted={brand.palette.muted}
              />
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border bg-card p-6 sm:p-7"
        style={{ borderColor: brand.palette.border }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Suivi de l&apos;expédition</h2>
          <span
            className="text-xs"
            style={{ color: brand.palette.muted }}
          >
            {events.length} évènement{events.length > 1 ? "s" : ""}
          </span>
        </div>

        <ol className="relative space-y-5 pl-6 mb-2">
          <span
            aria-hidden
            className="absolute left-[7px] top-1.5 bottom-1.5 w-px"
            style={{ background: brand.palette.border }}
          />
          {events.length === 0 ? (
            <li>
              <p className="text-sm" style={{ color: brand.palette.muted }}>
                Aucun évènement enregistré pour le moment.
              </p>
            </li>
          ) : (
            events.map((e, i) => {
              const isCurrent = i === 0;
              const dotColor = e.status_color ?? brand.primary;
              return (
                <li key={e.id} className="relative">
                  <span
                    className="absolute -left-6 top-1 size-3.5 rounded-full border-2"
                    style={{
                      background: dotColor,
                      borderColor: brand.palette.bg,
                      boxShadow: isCurrent
                        ? `0 0 0 3px color-mix(in srgb, ${dotColor} 30%, transparent)`
                        : undefined,
                    }}
                  />
                  <p
                    className={
                      isCurrent
                        ? "text-base font-semibold tracking-tight"
                        : "text-sm font-medium"
                    }
                  >
                    {e.status_label ?? "Évènement"}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: brand.palette.muted }}
                  >
                    {dateFmt.format(new Date(e.occurred_at))}
                  </p>
                  {e.comment ? (
                    <p className="text-sm mt-2 whitespace-pre-line">
                      {e.comment}
                    </p>
                  ) : null}
                </li>
              );
            })
          )}
        </ol>

        {!isFinal && currentIndex >= 0 ? (
          <div
            className="border-t pt-5 mt-6"
            style={{ borderColor: brand.palette.border }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3"
              style={{ color: brand.palette.muted }}
            >
              Étapes à venir
            </p>
            <ol className="space-y-2.5 pl-6 relative">
              <span
                aria-hidden
                className="absolute left-[7px] top-1.5 bottom-1.5 w-px"
                style={{
                  background: `repeating-linear-gradient(to bottom, ${brand.palette.border} 0 4px, transparent 4px 8px)`,
                }}
              />
              {statuses
                .filter(
                  (s, idx) =>
                    idx > currentIndex && !reachedStatusIds.has(s.id),
                )
                .map((s) => (
                  <li key={s.id} className="relative flex items-center gap-3">
                    <span
                      className="absolute -left-6 size-3 rounded-full border-2"
                      style={{
                        background: brand.palette.bg,
                        borderColor: s.color,
                        opacity: 0.6,
                      }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: brand.palette.muted }}
                    >
                      {s.label}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  tint,
  border,
  accent,
  muted,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tint: string;
  border: string;
  accent?: string;
  muted: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ background: tint, borderColor: border }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: accent ?? muted }}
      >
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}
