import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Package,
  Palette,
  Tags,
  Truck,
  LayoutDashboard,
  Languages,
  Users,
  Contact,
  Settings,
} from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import {
  getClientBrand,
  getClientThemeStyle,
} from "@/lib/branding/client-theme";
import { LogoutButton } from "./_logout-button";
import { MobileNav } from "./_mobile-nav";
import { NavLink } from "./_nav-link";
import { LanguageSwitcher } from "@/components/admin/language-switcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);
  return {
    title: {
      default: `${session.tenant.name} — Admin`,
      template: `%s · ${session.tenant.name}`,
    },
  };
}

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

  const brand = getClientBrand(session.tenant);
  const style = getClientThemeStyle(brand);

  const firstName =
    session.fullName?.trim().split(/\s+/)[0] ?? session.email ?? t("roles.readOnly");

  const navItems = (
    <>
      <NavLink href="/admin" exact>
        <LayoutDashboard className="size-5 lg:size-4" />
        {t("nav.dashboard")}
      </NavLink>
      <NavLink href="/admin/colis">
        <Package className="size-5 lg:size-4" />
        {t("nav.parcels")}
      </NavLink>
      <NavLink href="/admin/clients">
        <Contact className="size-5 lg:size-4" />
        {t("nav.clients")}
      </NavLink>
      <NavLink href="/admin/statuts">
        <Tags className="size-5 lg:size-4" />
        {t("nav.statuses")}
      </NavLink>
      <NavLink href="/admin/modes-transport">
        <Truck className="size-5 lg:size-4" />
        {t("nav.transportModes")}
      </NavLink>
      <NavLink href="/admin/utilisateurs">
        <Users className="size-5 lg:size-4" />
        {t("nav.users")}
      </NavLink>
      <NavLink href="/admin/reglages">
        <Settings className="size-5 lg:size-4" />
        {t("nav.settings")}
      </NavLink>
      {session.role === "entreprise_admin" ? (
        <>
          <NavLink href="/admin/apparence">
            <Palette className="size-5 lg:size-4" />
            {t("nav.appearance")}
          </NavLink>
          <NavLink href="/admin/traductions">
            <Languages className="size-5 lg:size-4" />
            {t("nav.translations")}
          </NavLink>
        </>
      ) : null}
    </>
  );

  const sessionInfo = (
    <div className="px-4 py-4 border-b">
      <p className="text-xs text-muted-foreground truncate">{firstName}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
        {session.role === "entreprise_admin"
          ? t("roles.admin")
          : t("roles.operator")}
      </p>
    </div>
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        className={
          brand.isDark
            ? "dark min-h-screen lg:flex bg-muted/30"
            : "min-h-screen lg:flex bg-muted/30"
        }
        style={style}
      >
        <MobileNav
          tenantName={session.tenant.name}
          logoUrl={session.tenant.logo_url}
          accentColor={brand.primary}
        >
          {sessionInfo}
          <nav className="flex-1 p-2 overflow-y-auto">{navItems}</nav>
          <LanguageSwitcher />
          {!session.impersonating ? (
            <LogoutButton subdomain={subdomain} />
          ) : null}
        </MobileNav>

        <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:bg-card lg:sticky lg:top-0 lg:h-screen">
          <div
            aria-hidden
            className="h-1 w-full"
            style={{ background: brand.primary }}
          />
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
              {firstName}
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
