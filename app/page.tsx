import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { Nav } from "./_marketing/nav";
import { Hero } from "./_marketing/hero";
import { Benefits } from "./_marketing/benefits";
import { Features } from "./_marketing/features";
import { HowItWorks } from "./_marketing/how-it-works";
import { SocialProof } from "./_marketing/social-proof";
import { SeoContent } from "./_marketing/seo-content";
import { Faq } from "./_marketing/faq";
import { CtaFooter } from "./_marketing/cta-footer";
import { Footer } from "./_marketing/footer";

const OG_LOCALE: Record<string, string> = {
  fr: "fr_FR",
  en: "en_US",
  zh: "zh_CN",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "marketing.meta" });
  const title = t("title");
  const description = t("description");
  const ogAlt = t("ogAlt");

  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "https://hervia.co/",
      title,
      description,
      siteName: "HERVIA",
      locale: OG_LOCALE[locale] ?? "fr_FR",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function Home() {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-foreground focus:shadow-lg"
      >
        Aller au contenu
      </a>
      <Nav />
      <main
        id="main"
        className="flex-1 font-[var(--font-marketing)] text-foreground"
      >
        <Hero />
        <Benefits />
        <Features />
        <HowItWorks />
        <SocialProof />
        <SeoContent />
        <Faq />
        <CtaFooter />
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
