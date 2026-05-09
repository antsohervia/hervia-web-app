import * as z from "zod";

const numericOptional = z
  .union([z.literal(""), z.coerce.number().positive()])
  .transform((v) => (v === "" ? null : v))
  .optional();

const stringOptional = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const CreateParcelSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Référence requise")
    .max(50, "50 caractères maximum")
    .regex(/^[A-Z0-9_-]+$/, "Lettres, chiffres, tirets, underscores"),
  transportModeId: z
    .string()
    .uuid("Mode de transport invalide")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  statusId: z.string().uuid("Statut requis"),
  shippedAt: z
    .string()
    .trim()
    .min(1, "Date d'expédition requise"),
  description: stringOptional,
  weightKg: numericOptional,
  volumeM3: numericOptional,
  estimatedPrice: numericOptional,
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Devise sur 3 lettres")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  originCountry: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length === 2 ? v : null)),
  destinationCountry: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length === 2 ? v : null)),
  estimatedDeliveryAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export type CreateParcelInput = z.infer<typeof CreateParcelSchema>;
export type CreateParcelState = {
  errors?: Partial<Record<keyof CreateParcelInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
  parcelId?: string;
};

export const UpdateParcelSchema = z.object({
  parcelId: z.uuid(),
  transportModeId: z
    .string()
    .uuid("Mode de transport invalide")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  description: stringOptional,
  weightKg: numericOptional,
  volumeM3: numericOptional,
  estimatedPrice: numericOptional,
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Devise sur 3 lettres")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  originCountry: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length === 2 ? v : null)),
  destinationCountry: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length === 2 ? v : null)),
  shippedAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  estimatedDeliveryAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export type UpdateParcelInput = z.infer<typeof UpdateParcelSchema>;
export type UpdateParcelState = {
  errors?: Partial<Record<keyof UpdateParcelInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export const ChangeStatusSchema = z.object({
  parcelId: z.uuid(),
  statusId: z.uuid(),
  comment: z
    .string()
    .trim()
    .max(500, "500 caractères maximum")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  occurredAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  forceFinalReopen: z
    .union([z.literal("on"), z.literal("")])
    .optional(),
});

export type ChangeStatusInput = z.infer<typeof ChangeStatusSchema>;
export type ChangeStatusState = {
  errors?: Partial<Record<keyof ChangeStatusInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export const AddParcelByTrackingSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Numéro de tracking requis")
    .max(50, "50 caractères maximum")
    .regex(/^[A-Z0-9_-]+$/, "Lettres, chiffres, tirets, underscores"),
  transportModeId: z.uuid("Mode de transport invalide"),
});

export type AddParcelByTrackingInput = z.infer<typeof AddParcelByTrackingSchema>;
export type AddParcelByTrackingOutcome =
  | "created"
  | "linked"
  | "already_linked";
export type AddParcelByTrackingState = {
  errors?: Partial<Record<keyof AddParcelByTrackingInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
  parcelId?: string;
  outcome?: AddParcelByTrackingOutcome;
};

export type ScanResult = {
  ok: boolean;
  reference: string;
  clientName?: string | null;
  created?: boolean;
  errorType?: "already_at_status" | "is_final" | "error";
  errorMessage?: string;
};
