import "server-only";
import type { TenantDetail } from "@/lib/tenants/repo";
import { getClientBrand } from "@/lib/branding/client-theme";

const FALLBACK_ICON = "/hervia-logo.png";
const FALLBACK_ICON_TYPE = "image/png";

function guessIconType(url: string): string {
  const path = url.toLowerCase().split("?")[0].split("#")[0];
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".ico")) return "image/x-icon";
  return "image/png";
}

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
  const iconSrc = tenant.logo_url ?? FALLBACK_ICON;
  const iconType = tenant.logo_url
    ? guessIconType(tenant.logo_url)
    : FALLBACK_ICON_TYPE;

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
        src: iconSrc,
        sizes: "any",
        type: iconType,
        purpose: "any",
      },
    ],
  };
}
