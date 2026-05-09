import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  PackageOpen,
  Search,
} from "lucide-react";
import { requireClientSession } from "@/lib/auth/client-dal";
import { getClientParcelStats, listClientParcels } from "@/lib/clients/repo";
import { getClientBrand } from "@/lib/branding/client-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" });

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    period?: string;
    page?: string;
  }>;
};

function periodToRange(
  period: string | undefined,
): { from?: string; to?: string } {
  const now = new Date();
  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString() };
  }
  if (period === "3months") {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 3);
    return { from: from.toISOString() };
  }
  if (period === "year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { from: from.toISOString() };
  }
  return {};
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Bonsoir";
  if (h < 18) return "Bonjour";
  return "Bonsoir";
}

export default async function ClientDashboardPage({
  params,
  searchParams,
}: Props) {
  const { subdomain } = await params;
  const sp = await searchParams;
  const session = await requireClientSession(subdomain);
  const brand = getClientBrand(session.tenant);

  const page = sp.page ? Math.max(1, parseInt(sp.page, 10)) : 1;
  const statusType =
    sp.status === "active" || sp.status === "final" ? sp.status : "all";
  const range = periodToRange(sp.period);

  const [{ rows, total, pageSize }, stats] = await Promise.all([
    listClientParcels(session.clientId, session.tenant.id, {
      search: sp.q,
      statusType,
      dateFrom: range.from,
      dateTo: range.to,
      page,
      pageSize: 20,
    }),
    getClientParcelStats(session.clientId, session.tenant.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstName = session.fullName.split(/\s+/)[0] ?? session.fullName;
  const hasFilters =
    !!sp.q || (sp.status && sp.status !== "all") || !!sp.period;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{
          borderColor: brand.palette.border,
          background: `linear-gradient(135deg, color-mix(in srgb, ${brand.primary} 12%, ${brand.palette.card}) 0%, ${brand.palette.card} 70%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-72 rounded-full opacity-30"
          style={{
            background: brand.primary,
            filter: "blur(80px)",
          }}
        />
        <div className="relative">
          <p
            className="text-xs uppercase tracking-[0.18em] font-semibold"
            style={{ color: brand.primary }}
          >
            {session.tenant.name}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
            {greeting()}, {firstName}
          </h1>
          <p
            className="text-sm mt-1.5 max-w-xl"
            style={{ color: brand.palette.muted }}
          >
            Retrouvez l&apos;ensemble de vos expéditions confiées à{" "}
            {session.tenant.name}, leur statut et les prochaines étapes.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-6 max-w-xl">
            <KpiCard
              label="Total"
              value={stats.total}
              icon={<Package className="size-4" />}
              tint={brand.palette.cardElevated}
              border={brand.palette.border}
              fg={brand.palette.text}
              muted={brand.palette.muted}
            />
            <KpiCard
              label="En cours"
              value={stats.active}
              icon={<PackageOpen className="size-4" />}
              tint={`color-mix(in srgb, ${brand.primary} 14%, ${brand.palette.card})`}
              border={`color-mix(in srgb, ${brand.primary} 30%, ${brand.palette.border})`}
              fg={brand.palette.text}
              muted={brand.palette.muted}
              accent={brand.primary}
            />
            <KpiCard
              label="Livrées"
              value={stats.final}
              icon={<CheckCircle2 className="size-4" />}
              tint={brand.palette.cardElevated}
              border={brand.palette.border}
              fg={brand.palette.text}
              muted={brand.palette.muted}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Mes expéditions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total === 0
                ? "Aucune expédition ne correspond pour le moment."
                : `${total} expédition${total > 1 ? "s" : ""}${
                    hasFilters ? " correspondante" + (total > 1 ? "s" : "") : ""
                  }.`}
            </p>
          </div>
        </div>

        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
          style={{ borderColor: brand.palette.border }}
        >
          <div className="space-y-1.5 flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Numéro de tracking ou description…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Statut
            </label>
            <select
              name="status"
              defaultValue={statusType}
              className="flex h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">Tous</option>
              <option value="active">En cours</option>
              <option value="final">Livrées</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Période
            </label>
            <select
              name="period"
              defaultValue={sp.period ?? ""}
              className="flex h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Toutes</option>
              <option value="month">Ce mois</option>
              <option value="3months">3 derniers mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>
          <Button type="submit" size="sm">
            Filtrer
          </Button>
          {hasFilters ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/">Réinitialiser</Link>
            </Button>
          ) : null}
        </form>

        {rows.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{
              borderColor: brand.palette.border,
              background: brand.palette.card,
            }}
          >
            <div
              className="mx-auto size-12 rounded-full flex items-center justify-center mb-4"
              style={{
                background: `color-mix(in srgb, ${brand.primary} 12%, transparent)`,
                color: brand.primary,
              }}
            >
              <Package className="size-6" />
            </div>
            <p className="font-medium">Aucune expédition à afficher</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {hasFilters
                ? "Essayez d'élargir vos critères de recherche."
                : `Contactez ${session.tenant.name} pour qu'une expédition soit enregistrée à votre nom.`}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const isFinal = r.status_type === "final";
              const dateLabel = isFinal
                ? r.updated_at
                : r.estimated_delivery_at;
              const dateLabelText = isFinal
                ? "Livré le"
                : r.estimated_delivery_at
                  ? "Livraison estimée"
                  : "Mis à jour le";
              const statusColor = r.status_color ?? brand.palette.muted;
              return (
                <li key={r.id}>
                  <Link
                    href={`/parcels/${r.id}`}
                    className="group relative flex items-stretch gap-4 rounded-xl border bg-card p-4 sm:p-5 transition-all hover:shadow-sm"
                    style={{ borderColor: brand.palette.border }}
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                      style={{ background: statusColor }}
                    />
                    <div className="flex-1 min-w-0 pl-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold tracking-tight truncate">
                            {r.reference}
                          </p>
                          {r.description ? (
                            <p
                              className="text-xs line-clamp-1 mt-0.5"
                              style={{ color: brand.palette.muted }}
                            >
                              {r.description}
                            </p>
                          ) : null}
                          <p
                            className="text-xs mt-1.5"
                            style={{ color: brand.palette.muted }}
                          >
                            Créé le {dateFmt.format(new Date(r.created_at))}
                            {dateLabel ? (
                              <>
                                {" · "}
                                {dateLabelText}{" "}
                                <span style={{ color: brand.palette.text }}>
                                  {dateFmt.format(new Date(dateLabel))}
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        {r.status_label ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shrink-0"
                            style={{
                              background: `color-mix(in srgb, ${statusColor} 16%, transparent)`,
                              color: statusColor,
                              border: `1px solid color-mix(in srgb, ${statusColor} 35%, transparent)`,
                            }}
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ background: statusColor }}
                            />
                            {r.status_label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <ArrowRight
                      className="size-4 self-center shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: brand.palette.muted }}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildPageHref(sp, page - 1)}>Précédent</Link>
                </Button>
              ) : null}
              {page < totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildPageHref(sp, page + 1)}>Suivant</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tint,
  border,
  fg,
  muted,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tint: string;
  border: string;
  fg: string;
  muted: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5"
      style={{ background: tint, borderColor: border, color: fg }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: accent ?? muted }}
      >
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
    </div>
  );
}

function buildPageHref(
  sp: { q?: string; status?: string; period?: string; page?: string },
  page: number,
): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.status) params.set("status", sp.status);
  if (sp.period) params.set("period", sp.period);
  params.set("page", String(page));
  return `/?${params.toString()}`;
}
