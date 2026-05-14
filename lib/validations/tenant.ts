import * as z from "zod";

export const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "admin",
  "app",
  "mail",
  "support",
] as const;

export const SUBDOMAIN_RX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export const SUSPENSION_REASONS = [
  "impaye",
  "fraude",
  "demande_client",
  "maintenance",
  "autre",
] as const;

export const SUSPENSION_REASON_LABELS: Record<
  (typeof SUSPENSION_REASONS)[number],
  string
> = {
  impaye: "Impayé",
  fraude: "Fraude",
  demande_client: "Demande client",
  maintenance: "Maintenance",
  autre: "Autre",
};

export const SUPPORTED_TIMEZONES = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Lisbon",
  "Africa/Casablanca",
  "Africa/Tunis",
  "Africa/Algiers",
  "Africa/Abidjan",
  "Africa/Dakar",
  "Africa/Antananarivo",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "UTC",
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

export const CreateTenantSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères").max(80),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Au moins 3 caractères")
    .max(40, "40 caractères maximum")
    .regex(
      SUBDOMAIN_RX,
      "Lettres minuscules, chiffres et tirets uniquement",
    )
    .refine(
      (s) => !(RESERVED_SUBDOMAINS as readonly string[]).includes(s),
      "Ce sous-domaine est réservé",
    ),
  adminEmail: z.email("Email invalide"),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, "Code pays ISO sur 2 lettres"),
  defaultCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Code devise sur 3 lettres")
    .regex(/^[A-Z]{3}$/, "Lettres majuscules uniquement"),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

export const SuspendTenantSchema = z.object({
  tenantId: z.uuid(),
  reason: z.enum(SUSPENSION_REASONS),
  note: z.string().max(2000).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
});

export type SuspendTenantInput = z.infer<typeof SuspendTenantSchema>;

export const DeleteTenantSchema = z.object({
  tenantId: z.uuid(),
  confirmedSubdomain: z.string().trim().toLowerCase(),
});

export type DeleteTenantInput = z.infer<typeof DeleteTenantSchema>;

export const UpdateTenantSchema = z.object({
  tenantId: z.uuid(),
  name: z.string().trim().min(2, "Au moins 2 caractères").max(80),
  adminEmail: z.email("Email invalide"),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, "Code pays ISO sur 2 lettres"),
  defaultCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Code devise sur 3 lettres")
    .regex(/^[A-Z]{3}$/, "Lettres majuscules uniquement"),
  timezone: z.enum(SUPPORTED_TIMEZONES),
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

export type CreateTenantState = {
  errors?: Partial<Record<keyof CreateTenantInput, string[]>> & {
    _form?: string[];
  };
  suggestions?: string[];
  invitationLink?: string;
  tenantId?: string;
  ok?: boolean;
};

export type SuspendTenantState = {
  errors?: Partial<Record<keyof SuspendTenantInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export type DeleteTenantState = {
  errors?: Partial<Record<keyof DeleteTenantInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export type UpdateTenantState = {
  errors?: Partial<Record<keyof UpdateTenantInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export function suggestSubdomains(taken: string): string[] {
  const base = taken.replace(/-+$/, "");
  const year = new Date().getFullYear();
  return [`${base}-1`, `${base}-co`, `${base}-app`, `${base}-${year}`].filter(
    (s) =>
      SUBDOMAIN_RX.test(s) &&
      !(RESERVED_SUBDOMAINS as readonly string[]).includes(s),
  );
}
