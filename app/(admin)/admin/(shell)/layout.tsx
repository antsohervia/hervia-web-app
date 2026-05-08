import Link from "next/link";
import type { ReactNode } from "react";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Users,
} from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import {
  ADMIN_ROLE_LABELS,
  canManageAdmins,
  type AdminRole,
} from "@/lib/auth/roles";
import { logoutAction } from "../login/_actions";

export default async function AdminShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePlatformAdmin();
  const role = session.role as AdminRole;
  const showAdminsLink = canManageAdmins(role);

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="px-4 py-5 border-b">
          <Link href="/admin/dashboard" className="font-semibold text-lg">
            TrackApp Admin
          </Link>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {session.user.email}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {ADMIN_ROLE_LABELS[role]}
          </p>
        </div>
        <nav className="flex-1 p-2 text-sm">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <LayoutDashboard className="size-4" />
            Tableau de bord
          </Link>
          <Link
            href="/admin/tenants"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <Building2 className="size-4" />
            Tenants
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <ScrollText className="size-4" />
            Journal d&apos;audit
          </Link>
          {showAdminsLink ? (
            <Link
              href="/admin/admins"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
            >
              <Users className="size-4" />
              Administrateurs
            </Link>
          ) : null}
        </nav>
        <form action={logoutAction} className="p-2 border-t">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent text-muted-foreground"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </form>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
