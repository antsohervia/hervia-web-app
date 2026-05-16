"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  exact?: boolean;
};

export function NavLink({ href, children, exact = false }: Props) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : undefined}
      className="flex items-center gap-3 px-3 py-3 rounded-md text-sm min-h-11 transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] data-[active=true]:bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] data-[active=true]:text-[color:var(--brand-primary)] data-[active=true]:font-medium"
    >
      {children}
    </Link>
  );
}
