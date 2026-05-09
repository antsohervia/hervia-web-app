import Link from "next/link";
import type { ReactNode } from "react";
import {
  Package,
  Palette,
  Tags,
  LayoutDashboard,
} from "lucide-react";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { LogoutButton } from "./_logout-button";

export default async function TenantAdminShellLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-60 border-r bg-card flex flex-col">
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
        <nav className="flex-1 p-2 text-sm">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <LayoutDashboard className="size-4" />
            Tableau de bord
          </Link>
          <Link
            href="/admin/colis"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <Package className="size-4" />
            Colis
          </Link>
          <Link
            href="/admin/statuts"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <Tags className="size-4" />
            Statuts
          </Link>
          {session.role === "entreprise_admin" ? (
            <Link
              href="/admin/apparence"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
            >
              <Palette className="size-4" />
              Apparence
            </Link>
          ) : null}
        </nav>
        {!session.impersonating ? (
          <LogoutButton subdomain={subdomain} />
        ) : null}
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
