import { getTranslations } from "next-intl/server";
import { Reveal } from "./reveal";

type Subsection = { title: string; body: string };

export async function SeoContent() {
  const t = await getTranslations("marketing.seoContent");
  const subsections = t.raw("subsections") as Subsection[];

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {t("title")}
          </h2>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>
        </Reveal>

        <div className="mt-12 space-y-12">
          {subsections.map((s, i) => (
            <Reveal key={i} delay={i * 60} as="article">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {s.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-foreground/80">
                {s.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
