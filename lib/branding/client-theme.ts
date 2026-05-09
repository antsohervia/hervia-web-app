import "server-only";
import type { CSSProperties } from "react";
import type { TenantDetail } from "@/lib/tenants/repo";

export type TenantTheme = "light" | "dark" | "corporate";

export type ThemePalette = {
  bg: string;
  card: string;
  cardElevated: string;
  text: string;
  muted: string;
  border: string;
  accentBg: string;
};

export const THEME_PALETTES: Record<TenantTheme, ThemePalette> = {
  light: {
    bg: "#FFFFFF",
    card: "#FFFFFF",
    cardElevated: "#F8F9FA",
    text: "#1A1A2E",
    muted: "#6B7280",
    border: "#E5E7EB",
    accentBg: "#F1F5F9",
  },
  dark: {
    bg: "#0F1117",
    card: "#1E2130",
    cardElevated: "#262A3D",
    text: "#F1F3F5",
    muted: "#9CA3AF",
    border: "#374151",
    accentBg: "#262A3D",
  },
  corporate: {
    bg: "#0D1B2A",
    card: "#1B2A3B",
    cardElevated: "#26384D",
    text: "#FFFFFF",
    muted: "#A8B8C8",
    border: "#2E4057",
    accentBg: "#26384D",
  },
};

export function contrastWith(hex: string): "#FFFFFF" | "#0F172A" {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0F172A" : "#FFFFFF";
}

/**
 * Convertit un hex en `r g b` (string) pour usage en color-mix ou rgba.
 */
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export type ClientBrand = {
  theme: TenantTheme;
  palette: ThemePalette;
  primary: string;
  primaryForeground: string;
  secondary: string | null;
  secondaryForeground: string | null;
  isDark: boolean;
};

export function getClientBrand(
  tenant: Pick<TenantDetail, "theme" | "primary_color" | "secondary_color">,
): ClientBrand {
  const theme = (tenant.theme ?? "light") as TenantTheme;
  const palette = THEME_PALETTES[theme];
  const primary = tenant.primary_color || "#1A56DB";
  const secondary = tenant.secondary_color;
  return {
    theme,
    palette,
    primary,
    primaryForeground: contrastWith(primary),
    secondary,
    secondaryForeground: secondary ? contrastWith(secondary) : null,
    isDark: theme !== "light",
  };
}

/**
 * Style à poser sur la racine du sous-arbre client pour faire vivre le thème
 * du tenant via les variables CSS shadcn. Les composants UI suivent
 * automatiquement (`bg-card`, `text-muted-foreground`, `bg-primary`, etc.).
 */
export function getClientThemeStyle(brand: ClientBrand): CSSProperties {
  const p = brand.palette;
  return {
    ["--background" as string]: p.bg,
    ["--foreground" as string]: p.text,
    ["--card" as string]: p.card,
    ["--card-foreground" as string]: p.text,
    ["--popover" as string]: p.card,
    ["--popover-foreground" as string]: p.text,
    ["--muted" as string]: p.cardElevated,
    ["--muted-foreground" as string]: p.muted,
    ["--accent" as string]: p.accentBg,
    ["--accent-foreground" as string]: p.text,
    ["--border" as string]: p.border,
    ["--input" as string]: p.border,
    ["--ring" as string]: brand.primary,
    ["--primary" as string]: brand.primary,
    ["--primary-foreground" as string]: brand.primaryForeground,
    ["--secondary" as string]: p.cardElevated,
    ["--secondary-foreground" as string]: p.text,
    ["--brand-primary" as string]: brand.primary,
    ["--brand-primary-rgb" as string]: hexToRgb(brand.primary),
    ["--brand-secondary" as string]: brand.secondary ?? brand.primary,
    backgroundColor: p.bg,
    color: p.text,
  } as CSSProperties;
}
