import "server-only";
import type { TenantDetail } from "@/lib/tenants/repo";
import { getClientBrand } from "@/lib/branding/client-theme";

function shortName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 12 ? `${trimmed.slice(0, 11)}…` : trimmed;
}

export type TenantManifest = {
  id: string;
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: "standalone";
  orientation: "portrait";
  lang: string;
  dir: "ltr";
  theme_color: string;
  background_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose: "any" | "maskable" | "any maskable";
  }>;
};

export function buildTenantManifest(tenant: TenantDetail): TenantManifest {
  const brand = getClientBrand(tenant);

  return {
    id: "/",
    name: tenant.name,
    short_name: shortName(tenant.name),
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    dir: "ltr",
    theme_color: brand.primary,
    background_color: brand.palette.bg,
    icons: [
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
