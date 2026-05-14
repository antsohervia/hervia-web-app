"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n/config";

const LABEL: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  zh: "中文",
};

const FLAG: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  zh: "🇨🇳",
};

export function MarketingLanguageSwitcher() {
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function switchLocale(next: Locale) {
    if (next === locale || pending) return;
    setPending(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    window.location.reload();
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        disabled={pending}
      >
        <Globe className="size-4" aria-hidden="true" />
        <span className="uppercase tracking-wide">{locale}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-2 min-w-[180px] rounded-xl border border-border/60 bg-popover shadow-xl ring-1 ring-black/5 p-1.5 z-50 animate-in fade-in slide-in-from-top-1"
        >
          {locales.map((l) => {
            const isActive = l === locale;
            return (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  disabled={pending}
                  onClick={() => switchLocale(l)}
                  className={`w-full text-left flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-brand/10 text-foreground"
                      : "text-foreground/80 hover:bg-foreground/5"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true">{FLAG[l]}</span>
                    {LABEL[l]}
                  </span>
                  {isActive && <Check className="size-4 text-brand" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
