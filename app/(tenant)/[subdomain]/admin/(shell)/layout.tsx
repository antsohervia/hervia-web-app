import Link from "next/link";
import type { ReactNode } from "react";
import {
  Package,
  Palette,
  Tags,
  Truck,
  LayoutDashboard,
  Languages,
} from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { LogoutButton } from "./_logout-button";
import { MobileNav } from "./_mobile-nav";
import { LanguageSwitcher } from "@/components/admin/language-switcher";

export default async function TenantAdminShellLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);
  const [t, locale, messages] = await Promise.all([
    getTranslations(),
    getLocale(),
    getMessages(),
  ]);

  const navItems = (
    <>
      <Link
        href="/admin"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <LayoutDashboard className="size-5 lg:size-4" />
        {t("nav.dashboard")}
      </Link>
      <Link
        href="/admin/colis"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <Package className="size-5 lg:size-4" />
        {t("nav.parcels")}
      </Link>
      <Link
        href="/admin/statuts"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <Tags className="size-5 lg:size-4" />
        {t("nav.statuses")}
      </Link>
      <Link
        href="/admin/modes-transport"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <Truck className="size-5 lg:size-4" />
        {t("nav.transportModes")}
      </Link>
      {session.role === "entreprise_admin" ? (
        <>
          <Link
            href="/admin/apparence"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
          >
            <Palette className="size-5 lg:size-4" />
            {t("nav.appearance")}
          </Link>
          <Link
            href="/admin/traductions"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
          >
            <Languages className="size-5 lg:size-4" />
            {t("nav.translations")}
          </Link>
        </>
      ) : null}
    </>
  );

  const sessionInfo = (
    <div className="px-4 py-4 border-b">
      <p className="text-xs text-muted-foreground truncate">
        {session.email ?? t("roles.readOnly")}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
        {session.role === "entreprise_admin"
          ? t("roles.admin")
          : t("roles.operator")}
      </p>
    </div>
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen lg:flex bg-muted/30">
        <MobileNav tenantName={session.tenant.name} logoUrl={session.tenant.logo_url}>
          {sessionInfo}
          <nav className="flex-1 p-2 overflow-y-auto">{navItems}</nav>
          <LanguageSwitcher />
          {!session.impersonating ? (
            <LogoutButton subdomain={subdomain} />
          ) : null}
        </MobileNav>

        <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:bg-card lg:sticky lg:top-0 lg:h-screen">
          <div className="px-4 py-5 border-b">
            <Link href="/admin" className="block">
              {session.tenant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.tenant.logo_url}
                  alt={session.tenant.name}
                  className="h-10 w-auto object-contain max-w-full"
                />
              ) : (
                <span className="font-semibold text-lg truncate block">
                  {session.tenant.name}
                </span>
              )}
            </Link>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {session.email ?? t("roles.readOnly")}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
              {session.role === "entreprise_admin"
                ? t("roles.admin")
                : t("roles.operator")}
            </p>
          </div>
          <nav className="flex-1 p-2">{navItems}</nav>
          <LanguageSwitcher />
          {!session.impersonating ? (
            <LogoutButton subdomain={subdomain} />
          ) : null}
        </aside>
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
