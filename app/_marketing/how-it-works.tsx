import { getTranslations } from "next-intl/server";
import { Reveal } from "./reveal";

type Step = { number: string; title: string; body: string };

const STEP_GRADIENTS = [
  { grad: "from-brand to-[var(--accent-cyan)]", shadow: "shadow-brand/30" },
  { grad: "from-[var(--accent-cyan)] to-[var(--accent-emerald)]", shadow: "shadow-[var(--accent-cyan)]/30" },
  { grad: "from-[var(--accent-violet)] to-[var(--accent-rose)]", shadow: "shadow-[var(--accent-violet)]/30" },
  { grad: "from-[var(--accent-amber)] to-[var(--accent-rose)]", shadow: "shadow-[var(--accent-amber)]/30" },
];

export async function HowItWorks() {
  const t = await getTranslations("marketing.howItWorks");
  const steps = t.raw("steps") as Step[];

  return (
    <section
      id="how-it-works"
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

        <div className="mt-14 sm:mt-20 relative">
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/40 via-[var(--accent-violet)]/40 to-transparent"
          />
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {steps.map((step, i) => {
              const { grad, shadow } = STEP_GRADIENTS[i % STEP_GRADIENTS.length];
              return (
                <Reveal
                  key={i}
                  as="li"
                  delay={i * 80}
                  className="relative text-center sm:text-left"
                >
                  <div
                    className={`relative inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br ${grad} text-white font-extrabold text-lg shadow-lg ${shadow} ring-4 ring-background`}
                  >
                    {step.number}
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
