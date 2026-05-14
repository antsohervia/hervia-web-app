"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { MarketingLanguageSwitcher } from "./marketing-language-switcher";

const LINKS = [
  { key: "features", href: "#features" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "faq", href: "#faq" },
] as const;

export function Nav() {
  const t = useTranslations("marketing.nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        frame = 0;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/60 shadow-sm"
          : "bg-background/0 border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center justify-self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex md:justify-self-center items-center gap-1 text-sm font-medium"
        >
          {LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="rounded-full px-4 py-2 text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex md:justify-self-end items-center gap-2">
          <MarketingLanguageSwitcher />
          <a
            href="mailto:contact@hervia.co"
            className="inline-flex items-center justify-center rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-semibold shadow-sm hover:bg-brand-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap"
          >
            {t("ctaPrimary")}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("openMenu")}
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center size-11 rounded-md text-foreground/80 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          <Menu className="size-6" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden bg-background animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border/60">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
              className="inline-flex items-center justify-center size-11 rounded-md text-foreground/80 hover:bg-foreground/5"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <nav
            aria-label="Mobile"
            className="px-4 py-6 flex flex-col gap-1 text-lg font-medium"
          >
            {LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 hover:bg-foreground/5 min-h-11 flex items-center"
              >
                {t(link.key)}
              </a>
            ))}
            <div className="mt-4 grid gap-3">
              <a
                href="mailto:contact@hervia.co"
                className="inline-flex items-center justify-center rounded-full bg-brand text-brand-foreground px-5 py-3 text-base font-semibold shadow-sm"
              >
                {t("ctaPrimary")}
              </a>
              <a
                href="mailto:contact@hervia.co?subject=Demande%20de%20d%C3%A9mo%20HERVIA"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background text-foreground px-5 py-3 text-base font-semibold"
              >
                {t("ctaSecondary")}
              </a>
              <div className="pt-4">
                <MarketingLanguageSwitcher />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
