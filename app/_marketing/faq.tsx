import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Reveal } from "./reveal";

type QA = { q: string; a: string };

export async function Faq() {
  const t = await getTranslations("marketing.faq");
  const items = t.raw("items") as QA[];

  return (
    <section
      id="faq"
      className="scroll-mt-20 py-16 sm:py-24 lg:py-32 bg-muted/30"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="text-center">
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            {t("eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        <div className="mt-12 sm:mt-16 rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
          {items.map((item, i) => (
            <details key={i} className="hervia-faq group">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4 px-5 sm:px-6 py-5 sm:py-6 hover:bg-foreground/[0.02] transition-colors focus-visible:outline-none focus-visible:bg-foreground/[0.03] min-h-11">
                <span className="text-base sm:text-lg font-semibold text-foreground pr-4">
                  {item.q}
                </span>
                <span className="shrink-0 inline-flex items-center justify-center size-8 rounded-full bg-brand/10 text-brand transition-transform duration-300 group-open:rotate-45">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 -mt-1">
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
