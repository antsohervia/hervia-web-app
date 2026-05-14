import { getTranslations } from "next-intl/server";
import {
  LayoutDashboard,
  Palette,
  ScanLine,
  Tags,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./reveal";

type Item = { title: string; body: string; highlights: string[] };

const FEATURE_ICONS: LucideIcon[] = [
  LayoutDashboard,
  Palette,
  ScanLine,
  Tags,
];

const FEATURE_GRADIENTS = [
  "from-brand to-[var(--accent-cyan)]",
  "from-[var(--accent-violet)] to-[var(--accent-rose)]",
  "from-[var(--accent-emerald)] to-[var(--accent-cyan)]",
  "from-[var(--accent-amber)] to-[var(--accent-rose)]",
];

const FEATURE_SHADOWS = [
  "shadow-brand/25",
  "shadow-[var(--accent-violet)]/25",
  "shadow-[var(--accent-emerald)]/25",
  "shadow-[var(--accent-amber)]/25",
];

export async function Features() {
  const t = await getTranslations("marketing.features");
  const items = t.raw("items") as Item[];

  return (
    <section
      id="features"
      className="scroll-mt-20 py-16 sm:py-24 lg:py-32 bg-muted/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="max-w-2xl mx-auto text-center">
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            {t("eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        <div className="mt-12 sm:mt-20 space-y-16 sm:space-y-24">
          {items.map((item, i) => {
            const Icon = FEATURE_ICONS[i] ?? LayoutDashboard;
            const isReversed = i % 2 === 1;
            return (
              <Reveal
                key={i}
                as="article"
                className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  isReversed ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div
                    className={`inline-flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${FEATURE_GRADIENTS[i % FEATURE_GRADIENTS.length]} text-white shadow-lg ${FEATURE_SHADOWS[i % FEATURE_SHADOWS.length]}`}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {item.highlights.map((h, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                          <Check className="size-3" aria-hidden="true" />
                        </span>
                        <span className="text-foreground/80">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <FeaturePreview index={i} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturePreview({ index }: { index: number }) {
  const haloColors = [
    "var(--accent-cyan)",
    "var(--accent-violet)",
    "var(--accent-emerald)",
    "var(--accent-amber)",
  ];
  const halo = haloColors[index % haloColors.length];
  return (
    <div className="relative rounded-2xl border border-border/60 bg-card shadow-xl ring-1 ring-black/5 overflow-hidden aspect-[4/3]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background: `radial-gradient(circle at 70% 30%, ${halo} 0%, transparent 60%)`,
        }}
      />
      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col">
        {index === 0 && <DashboardPreview />}
        {index === 1 && <BrandingPreview />}
        {index === 2 && <ScanPreview />}
        {index === 3 && <StatusesPreview />}
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total", value: "284", tone: "default" as const },
          { label: "En cours", value: "67", tone: "brand" as const },
          { label: "Livrés", value: "217", tone: "success" as const },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-background/80 p-2.5"
          >
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
              {k.label}
            </p>
            <p
              className={`text-xl font-bold tabular-nums ${
                k.tone === "brand"
                  ? "text-brand"
                  : k.tone === "success"
                    ? "text-emerald-600"
                    : "text-foreground"
              }`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="flex items-end gap-1.5 h-full">
          {[40, 65, 55, 80, 70, 90, 75, 95, 85, 100, 88, 110].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-brand to-brand-accent"
              style={{ height: `${(h / 110) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandingPreview() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="rounded-lg border border-border/60 bg-background/80 p-3 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-brand grid place-items-center text-brand-foreground font-bold">
          A
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold">Acme Logistics</p>
          <p className="text-[10px] text-muted-foreground">
            acme.hervia.co
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
          Palette
        </p>
        <div className="flex gap-2">
          {["#2B5BFE", "#0A1F44", "#7C9BFF", "#06B6D4", "#10B981"].map((c, i) => (
            <div
              key={i}
              className="size-8 rounded-md ring-1 ring-black/5"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 rounded-lg border border-border/60 bg-background/40 p-3 flex items-center justify-center">
        <span className="rounded-md bg-brand px-4 py-2 text-brand-foreground text-xs font-semibold shadow-md shadow-brand/25">
          Bouton de marque
        </span>
      </div>
    </div>
  );
}

function ScanPreview() {
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="rounded-lg border border-brand/40 bg-brand/5 p-3 flex items-center gap-3">
        <ScanLine className="size-5 text-brand animate-pulse" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-mono text-xs">FR-2026-04812</p>
          <p className="text-[10px] text-emerald-600 font-medium">
            ✓ Scanné · Statut mis à jour
          </p>
        </div>
      </div>
      {["FR-2026-04811", "FR-2026-04810", "FR-2026-04809"].map((ref) => (
        <div
          key={ref}
          className="rounded-lg border border-border/60 bg-background/80 p-2.5 flex items-center gap-3"
        >
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="size-3" aria-hidden="true" />
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {ref}
          </span>
          <span className="ml-auto text-[10px] text-emerald-600 font-medium">
            En transit
          </span>
        </div>
      ))}
      <div className="mt-auto rounded-lg bg-brand/10 px-3 py-2 text-center">
        <p className="text-xs font-medium text-brand">
          4 colis scannés · 1,2 sec/colis
        </p>
      </div>
    </div>
  );
}

function StatusesPreview() {
  const statuses = [
    { label: "À récupérer", color: "#94A3B8" },
    { label: "En préparation", color: "#F59E0B" },
    { label: "En transit", color: "#3B82F6" },
    { label: "Dédouanement", color: "#A855F7" },
    { label: "Livré", color: "#10B981" },
  ];
  return (
    <div className="flex flex-col gap-2 h-full">
      {statuses.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 p-2.5"
        >
          <span
            className="size-3 rounded-full ring-2 ring-white"
            style={{ backgroundColor: s.color }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-foreground">
            {s.label}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            #{i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
