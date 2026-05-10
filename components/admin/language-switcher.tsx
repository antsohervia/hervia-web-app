"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

const FLAG: Record<Locale, string> = { fr: "🇫🇷", en: "🇬🇧", zh: "🇨🇳" };

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function switchLocale(next: Locale) {
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="px-3 py-2 border-t">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
        <Globe className="size-3" />
        {t("title")}
      </p>
      <div className="flex gap-1">
        {locales.map((l) => (
          <Button
            key={l}
            variant={l === locale ? "secondary" : "ghost"}
            size="sm"
            disabled={pending}
            onClick={() => switchLocale(l)}
            className="flex-1 h-8 text-xs px-1"
            title={t(l)}
          >
            {FLAG[l]} {l.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}
