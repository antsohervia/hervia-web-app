import Link from "next/link";
import type { ReactNode } from "react";
import {
  Package,
  Palette,
  Tags,
  Truck,
  LayoutDashboard,
} from "lucide-react";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { LogoutButton } from "./_logout-button";
import { MobileNav } from "./_mobile-nav";

export default async function TenantAdminShellLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);

  const navItems = (
    <>
      <Link
        href="/admin"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <LayoutDashboard className="size-5 lg:size-4" />
        Tableau de bord
      </Link>
      <Link
        href="/admin/colis"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <Package className="size-5 lg:size-4" />
        Colis
      </Link>
      <Link
        href="/admin/statuts"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <Tags className="size-5 lg:size-4" />
        Statuts
      </Link>
      <Link
        href="/admin/modes-transport"
        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
      >
        <Truck className="size-5 lg:size-4" />
        Modes de transport
      </Link>
      {session.role === "entreprise_admin" ? (
        <Link
          href="/admin/apparence"
          className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent text-sm min-h-11"
        >
          <Palette className="size-5 lg:size-4" />
          Apparence
        </Link>
      ) : null}
    </>
  );

  const sessionInfo = (
    <div className="px-4 py-4 border-b">
      <p className="text-xs text-muted-foreground truncate">
        {session.email ?? "Mode lecture seule"}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
        {session.role === "entreprise_admin"
          ? "Administrateur"
          : "Opérateur"}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex bg-muted/30">
      <MobileNav tenantName={session.tenant.name}>
        {sessionInfo}
        <nav className="flex-1 p-2 overflow-y-auto">{navItems}</nav>
        {!session.impersonating ? (
          <LogoutButton subdomain={subdomain} />
        ) : null}
      </MobileNav>

      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:bg-card lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-5 border-b">
          <Link
            href="/admin"
            className="font-semibold text-lg block truncate"
          >
            {session.tenant.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {session.email ?? "Mode lecture seule"}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {session.role === "entreprise_admin"
              ? "Administrateur"
              : "Opérateur"}
          </p>
        </div>
        <nav className="flex-1 p-2">{navItems}</nav>
        {!session.impersonating ? (
          <LogoutButton subdomain={subdomain} />
        ) : null}
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
