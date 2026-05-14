import { getTranslations } from "next-intl/server";
import { Package, Search, Filter, MapPin } from "lucide-react";

type Row = { ref: string; route: string; status: string; eta: string };

const STATUS_STYLES: Record<string, string> = {
  "En transit": "bg-blue-50 text-blue-700 ring-blue-200",
  "In transit": "bg-blue-50 text-blue-700 ring-blue-200",
  运输中: "bg-blue-50 text-blue-700 ring-blue-200",
  Préparation: "bg-amber-50 text-amber-700 ring-amber-200",
  Preparing: "bg-amber-50 text-amber-700 ring-amber-200",
  准备中: "bg-amber-50 text-amber-700 ring-amber-200",
  Livré: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  已送达: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export async function HeroMockup() {
  const t = await getTranslations("marketing.hero");
  const mockupAlt = t("mockupAlt");
  const m = (k: string) => t(`mockup.${k}`);
  const rows = t.raw("mockup.rows") as Row[];

  return (
    <div
      role="img"
      aria-label={mockupAlt}
      className="relative w-full max-w-5xl mx-auto"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-[radial-gradient(circle_at_50%_40%,var(--brand)_0%,transparent_60%)]"
      />

      <div className="rounded-2xl bg-card text-card-foreground border border-border/60 shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border/60">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <div className="ml-4 hidden sm:flex flex-1 max-w-md items-center gap-2 rounded-md bg-background border border-border/60 px-3 py-1 text-xs text-muted-foreground font-mono">
            <span className="text-emerald-600">●</span>
            {m("browserUrl")}
          </div>
        </div>

        <div className="grid sm:grid-cols-[200px_1fr] min-h-[420px]">
          <aside className="hidden sm:flex flex-col gap-1 p-4 border-r border-border/60 bg-muted/20">
            <div className="flex items-center gap-2 px-2 py-2 mb-3">
              <span
                aria-hidden="true"
                className="grid place-items-center size-7 rounded-md bg-gradient-to-br from-[var(--accent-emerald)] to-[var(--accent-cyan)] text-white text-xs font-bold shadow-sm"
              >
                A
              </span>
              <span className="text-xs font-semibold tracking-tight text-foreground/80">
                Acme Logistics
              </span>
            </div>
            {[
              { icon: Package, label: m("greeting").split(",")[0], active: true },
              { icon: Search, label: "Recherche", active: false },
              { icon: Filter, label: "Filtres", active: false },
              { icon: MapPin, label: "Carte", active: false },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <span
                  key={i}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs ${
                    item.active
                      ? "bg-brand/10 text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </span>
              );
            })}
          </aside>

          <div className="p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-lg font-semibold tracking-tight">
                {m("greeting")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {m("subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <KpiCard label={m("kpiTotal")} value="128" tone="default" />
              <KpiCard label={m("kpiOngoing")} value="34" tone="brand" />
              <KpiCard label={m("kpiDelivered")} value="94" tone="success" />
            </div>

            <div className="space-y-2">
              {rows.map((row, i) => {
                const statusStyle =
                  STATUS_STYLES[row.status] ??
                  "bg-muted text-foreground ring-border";
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {row.ref}
                    </span>
                    <span className="hidden sm:block flex-1 truncate text-foreground/80">
                      {row.route}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusStyle}`}
                    >
                      {row.status}
                    </span>
                    <span className="hidden md:inline text-[11px] text-muted-foreground whitespace-nowrap">
                      {row.eta}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "brand" | "success";
}) {
  const accent =
    tone === "brand"
      ? "bg-gradient-to-br from-brand to-[var(--accent-cyan)] bg-clip-text text-transparent"
      : tone === "success"
        ? "text-[var(--accent-emerald)]"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>
        {value}
      </p>
    </div>
  );
}
