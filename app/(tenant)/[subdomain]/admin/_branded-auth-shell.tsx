import type { ReactNode } from "react";
import {
  getClientBrand,
  getClientThemeStyle,
} from "@/lib/branding/client-theme";
import type { TenantDetail } from "@/lib/tenants/repo";

type Props = {
  tenant: Pick<
    TenantDetail,
    "name" | "logo_url" | "theme" | "primary_color" | "secondary_color"
  >;
  children: ReactNode;
};

export function BrandedAuthShell({ tenant, children }: Props) {
  const brand = getClientBrand(tenant);
  const style = getClientThemeStyle(brand);

  return (
    <div
      className={
        brand.isDark
          ? "dark min-h-screen flex flex-col"
          : "min-h-screen flex flex-col"
      }
      style={style}
    >
      <div
        aria-hidden
        className="h-1 w-full shrink-0"
        style={{ background: brand.primary }}
      />
      <main
        className="flex-1 flex items-center justify-center p-6"
        style={{ background: brand.palette.bg }}
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
