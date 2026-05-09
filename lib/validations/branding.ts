import * as z from "zod";

export const TENANT_THEMES = ["light", "dark", "corporate"] as const;
export type TenantTheme = (typeof TENANT_THEMES)[number];

export const TENANT_THEME_LABELS: Record<TenantTheme, string> = {
  light: "Clair",
  dark: "Sombre",
  corporate: "Professionnel",
};

export const TENANT_THEME_DESCRIPTIONS: Record<TenantTheme, string> = {
  light:
    "Interface lumineuse, fond blanc, typographie sombre. Lisibilité maximale.",
  dark:
    "Interface moderne, fond sombre, contrastes forts. Image contemporaine.",
  corporate:
    "Fond bleu marine, typographie soignée. Image institutionnelle et premium.",
};

export const HEX_COLOR_RX = /^#[0-9A-Fa-f]{6}$/;

export const PublishThemeSchema = z.object({
  theme: z.enum(TENANT_THEMES),
  primaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOR_RX, "Format attendu : #RRGGBB"),
  secondaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOR_RX, "Format attendu : #RRGGBB")
    .optional()
    .or(z.literal("")),
});

export type PublishThemeInput = z.infer<typeof PublishThemeSchema>;
export type PublishThemeState = {
  errors?: Partial<Record<keyof PublishThemeInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
] as const;

export const LOGO_ACCEPTED_EXT = [".png", ".jpg", ".jpeg", ".svg"] as const;

export type LogoState = {
  error?: string;
  ok?: boolean;
};
