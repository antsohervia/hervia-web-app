"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  tenantName: string;
  logoUrl?: string | null;
  children: ReactNode;
};

export function MobileNav({ tenantName, logoUrl, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("menu");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 border-b bg-card px-3 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label={t("open")}
          className="size-11"
        >
          <Menu className="size-5" />
        </Button>
        <Link href="/admin" className="font-semibold truncate flex-1">
          {tenantName}
        </Link>
      </header>

      {open ? (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-card flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 h-14 border-b">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={tenantName} className="h-8 w-auto object-contain max-w-[160px]" />
              ) : (
                <span className="font-semibold truncate">{tenantName}</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label={t("closeButton")}
                className="size-11"
              >
                <X className="size-5" />
              </Button>
            </div>
            {children}
          </aside>
        </div>
      ) : null}
    </>
  );
}
