import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

export async function CtaFooter() {
  const t = await getTranslations("marketing.ctaFooter");

  return (
    <section className="py-16 sm:py-24 lg:py-28 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-secondary via-brand to-[var(--accent-cyan)] text-brand-foreground p-8 sm:p-12 lg:p-16 text-center shadow-2xl shadow-brand/30">
          <div
            aria-hidden="true"
            className="absolute -top-24 -left-24 size-72 rounded-full bg-[var(--accent-violet)]/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-24 size-72 rounded-full bg-[var(--accent-cyan)]/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-[var(--accent-rose)]/15 blur-3xl"
          />
          <h2 className="relative text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {t("title")}
          </h2>
          <p className="relative mt-4 text-lg sm:text-xl text-brand-foreground/90 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:contact@hervia.co?subject=Essai%20gratuit%20HERVIA"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-background text-foreground px-6 py-3.5 text-base font-semibold shadow-lg hover:bg-background/95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
            >
              {t("ctaPrimary")}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href="mailto:contact@hervia.co?subject=Demande%20de%20d%C3%A9mo%20HERVIA"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-brand-foreground/30 bg-brand-foreground/10 backdrop-blur-sm text-brand-foreground px-6 py-3.5 text-base font-semibold hover:bg-brand-foreground/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
