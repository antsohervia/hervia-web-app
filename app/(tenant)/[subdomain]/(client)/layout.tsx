import Link from "next/link";
import type { ReactNode } from "react";
import { requireClientSession } from "@/lib/auth/client-dal";
import {
  getClientBrand,
  getClientThemeStyle,
} from "@/lib/branding/client-theme";
import { ClientLogoutButton } from "./_logout-button";

export const dynamic = "force-dynamic";

export default async function ClientShellLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await requireClientSession(subdomain);
  const brand = getClientBrand(session.tenant);
  const style = getClientThemeStyle(brand);
  const initials = session.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  const year = new Date().getFullYear();

  return (
    <div
      className={brand.isDark ? "dark min-h-screen" : "min-h-screen"}
      style={style}
    >
      <div
        aria-hidden
        className="h-1 w-full"
        style={{ background: brand.primary }}
      />
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{
          background: `color-mix(in srgb, ${brand.palette.bg} 88%, transparent)`,
          borderColor: brand.palette.border,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            {session.tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.tenant.logo_url}
                alt={session.tenant.name}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div
                className="size-9 rounded-md flex items-center justify-center font-bold text-white"
                style={{ background: brand.primary }}
              >
                {session.tenant.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 hidden sm:block">
              <p className="font-semibold leading-tight truncate tracking-tight">
                {session.tenant.name}
              </p>
              <p
                className="text-[11px] leading-tight truncate"
                style={{ color: brand.palette.muted }}
              >
                Espace de suivi
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 border"
              style={{
                borderColor: brand.palette.border,
                background: brand.palette.cardElevated,
              }}
            >
              <span
                className="size-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  background: brand.primary,
                  color: brand.primaryForeground,
                }}
              >
                {initials || "·"}
              </span>
              <span className="text-sm font-medium truncate max-w-[160px]">
                {session.fullName}
              </span>
            </div>
            <ClientLogoutButton />
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem-0.25rem)]">{children}</main>

      <footer
        className="border-t"
        style={{ borderColor: brand.palette.border }}
      >
        <div
          className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs flex flex-wrap items-center justify-between gap-2"
          style={{ color: brand.palette.muted }}
        >
          <span>
            © {year} {session.tenant.name}. Tous droits réservés.
          </span>
          <span>Espace client sécurisé</span>
        </div>
      </footer>
    </div>
  );
}
