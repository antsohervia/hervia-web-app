import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { Nav } from "../_marketing/nav";
import { Footer } from "../_marketing/footer";

export default async function LegalLayout({ children }: { children: ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Nav />
      <main
        id="main"
        className="flex-1 font-[var(--font-marketing)] text-foreground"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {children}
        </div>
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
