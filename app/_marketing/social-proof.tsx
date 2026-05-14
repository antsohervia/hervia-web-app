import { getTranslations } from "next-intl/server";
import { Quote, Star } from "lucide-react";
import { Reveal } from "./reveal";

type Stat = { value: string; label: string };
type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function SocialProof() {
  const t = await getTranslations("marketing.socialProof");
  const stats = t.raw("stats") as Stat[];
  const testimonials = t.raw("testimonials") as Testimonial[];
  const logos = t.raw("logos") as string[];

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-muted/30 via-background to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="max-w-2xl mx-auto text-center">
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            {t("eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
        </Reveal>

        <Reveal
          as="dl"
          className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 max-w-5xl mx-auto"
        >
          {stats.map((s, i) => {
            const tones = [
              "from-brand to-[var(--accent-cyan)]",
              "from-[var(--accent-emerald)] to-[var(--accent-cyan)]",
              "from-[var(--accent-violet)] to-brand",
              "from-[var(--accent-amber)] to-[var(--accent-rose)]",
            ];
            return (
              <div
                key={i}
                className="text-center rounded-2xl border border-border/60 bg-card p-6 hover:shadow-md transition-shadow"
              >
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span
                    className={`block text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums bg-gradient-to-br ${tones[i % tones.length]} bg-clip-text text-transparent`}
                  >
                    {s.value}
                  </span>
                  <span className="mt-1.5 block text-xs sm:text-sm text-muted-foreground">
                    {s.label}
                  </span>
                </dd>
              </div>
            );
          })}
        </Reveal>

        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((tm, i) => (
            <Reveal
              key={i}
              delay={i * 80}
              as="figure"
              className="relative rounded-2xl border border-border/60 bg-card p-6 sm:p-7 flex flex-col"
            >
              <Quote
                className="absolute top-5 right-5 size-8 text-brand/20"
                aria-hidden="true"
              />
              <div
                className="flex gap-0.5 text-amber-400"
                aria-label="5 sur 5"
              >
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="size-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground/90 leading-relaxed text-sm sm:text-base">
                « {tm.quote} »
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-border/60 flex items-center gap-3">
                <div
                  className={`size-10 shrink-0 rounded-full text-white grid place-items-center text-sm font-bold bg-gradient-to-br ${
                    [
                      "from-brand to-[var(--accent-cyan)]",
                      "from-[var(--accent-violet)] to-[var(--accent-rose)]",
                      "from-[var(--accent-emerald)] to-[var(--accent-cyan)]",
                    ][i % 3]
                  }`}
                  aria-hidden="true"
                >
                  {initials(tm.author)}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-foreground">{tm.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {tm.role} · {tm.company}
                  </p>
                </div>
              </figcaption>
            </Reveal>
          ))}
        </div>

        <Reveal as="div" className="mt-16 sm:mt-20">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("logosTitle")}
          </p>
          <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8 items-center">
            {logos.map((name, i) => (
              <li
                key={i}
                className="text-center text-base sm:text-lg font-bold tracking-tight text-foreground/40 hover:text-foreground/70 transition-colors"
              >
                {name}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
