import { getTranslations } from "next-intl/server";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "./reveal";
import { HeroMockup } from "./hero-mockup";

type Stat = { value: string; label: string };

export async function Hero() {
  const t = await getTranslations("marketing.hero");
  const stats = t.raw("stats") as Stat[];

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-brand-muted via-background to-background" />
        <div className="absolute -top-32 -left-32 size-[480px] rounded-full bg-brand-accent/40 blur-3xl opacity-50" />
        <div className="absolute -top-16 right-0 size-[420px] rounded-full bg-brand/30 blur-3xl opacity-35" />
        <div className="absolute top-40 left-1/3 size-[360px] rounded-full bg-[var(--accent-cyan)]/25 blur-3xl opacity-50" />
        <div className="absolute top-72 right-1/4 size-[320px] rounded-full bg-[var(--accent-violet)]/20 blur-3xl opacity-40" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 lg:pt-28 pb-16 sm:pb-24">
        <Reveal as="div" className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-gradient-to-r from-brand/10 via-[var(--accent-cyan)]/10 to-[var(--accent-violet)]/10 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-brand">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t("eyebrow")}
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
            {t("title")}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:contact@hervia.co?subject=Essai%20gratuit%20HERVIA"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand via-brand to-[var(--accent-cyan)] text-brand-foreground px-6 py-3.5 text-base font-semibold shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-[1.02] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2"
            >
              {t("ctaPrimary")}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href="mailto:contact@hervia.co?subject=Demande%20de%20d%C3%A9mo%20HERVIA"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur-sm text-foreground px-6 py-3.5 text-base font-semibold hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2"
            >
              {t("ctaSecondary")}
            </a>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{t("trust")}</p>
        </Reveal>

        <Reveal as="div" delay={150} className="mt-14 sm:mt-20">
          <HeroMockup />
        </Reveal>

        <Reveal as="div" delay={300} className="mt-14 sm:mt-20">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 max-w-3xl mx-auto">
            {stats.map((s, i) => {
              const tones = [
                "from-brand to-[var(--accent-cyan)]",
                "from-[var(--accent-emerald)] to-[var(--accent-cyan)]",
                "from-[var(--accent-violet)] to-brand",
              ];
              return (
                <div
                  key={i}
                  className="text-center sm:text-left border-l-0 sm:border-l border-border/60 sm:pl-6 first:border-l-0 first:pl-0"
                >
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span
                      className={`block text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br ${tones[i % tones.length]} bg-clip-text text-transparent`}
                    >
                      {s.value}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {s.label}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
