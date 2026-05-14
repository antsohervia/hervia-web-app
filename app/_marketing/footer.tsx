import type { SVGProps } from "react";
import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import { Logo } from "./logo";

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.97 6.817H1.673l7.73-8.835L1.254 2.25h6.83l4.713 6.231 5.447-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

export async function Footer() {
  const t = await getTranslations("marketing.footer");
  const columns = t.raw("columns") as FooterColumn[];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Logo variant="light" className="text-background" />
            <p className="mt-5 text-sm leading-relaxed text-background/70 max-w-sm">
              {t("tagline")}
            </p>
            <a
              href="mailto:contact@hervia.co"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-background hover:text-brand-accent transition-colors"
            >
              <Mail className="size-4" aria-hidden="true" />
              {t("contact")}
            </a>
          </div>

          {columns.map((col, i) => (
            <nav key={i} aria-labelledby={`footer-col-${i}`}>
              <h3
                id={`footer-col-${i}`}
                className="text-sm font-semibold uppercase tracking-wide text-background"
              >
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.href}
                      className="text-sm text-background/70 hover:text-background transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-background/60">
            <p>{t("legal", { year })}</p>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <p>{t("madeIn")}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="sr-only">{t("social")}</span>
            {[
              { Icon: LinkedInIcon, label: "LinkedIn", href: "#" },
              { Icon: XIcon, label: "X (Twitter)", href: "#" },
              { Icon: GlobeIcon, label: "Site web", href: "#" },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex items-center justify-center size-10 rounded-full text-background/70 hover:text-background hover:bg-background/10 transition-colors"
              >
                <Icon className="size-5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
