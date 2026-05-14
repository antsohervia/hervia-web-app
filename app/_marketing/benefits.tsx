import { getTranslations } from "next-intl/server";
import {
  Zap,
  Workflow,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./reveal";

const ICONS: Record<string, LucideIcon> = {
  Zap,
  Workflow,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
};

const ACCENTS = [
  { bg: "bg-brand/10", text: "text-brand", hoverBg: "group-hover:bg-brand", border: "hover:border-brand/40" },
  { bg: "bg-[var(--accent-cyan)]/10", text: "text-[var(--accent-cyan)]", hoverBg: "group-hover:bg-[var(--accent-cyan)]", border: "hover:border-[var(--accent-cyan)]/40" },
  { bg: "bg-[var(--accent-amber)]/10", text: "text-[var(--accent-amber)]", hoverBg: "group-hover:bg-[var(--accent-amber)]", border: "hover:border-[var(--accent-amber)]/40" },
  { bg: "bg-[var(--accent-emerald)]/10", text: "text-[var(--accent-emerald)]", hoverBg: "group-hover:bg-[var(--accent-emerald)]", border: "hover:border-[var(--accent-emerald)]/40" },
  { bg: "bg-[var(--accent-violet)]/10", text: "text-[var(--accent-violet)]", hoverBg: "group-hover:bg-[var(--accent-violet)]", border: "hover:border-[var(--accent-violet)]/40" },
  { bg: "bg-[var(--accent-rose)]/10", text: "text-[var(--accent-rose)]", hoverBg: "group-hover:bg-[var(--accent-rose)]", border: "hover:border-[var(--accent-rose)]/40" },
];

type Item = { icon: keyof typeof ICONS; title: string; body: string };

export async function Benefits() {
  const t = await getTranslations("marketing.benefits");
  const items = t.raw("items") as Item[];

  return (
    <section
      id="benefits"
      className="scroll-mt-20 py-16 sm:py-24 lg:py-32 bg-background"
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

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <Reveal
                key={i}
                delay={i * 60}
                className={`group rounded-2xl border border-border/60 bg-card p-6 sm:p-7 hover:shadow-lg transition-all ${accent.border}`}
              >
                <div
                  className={`inline-flex items-center justify-center size-12 rounded-xl ${accent.bg} ${accent.text} ${accent.hoverBg} group-hover:text-white transition-colors`}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
