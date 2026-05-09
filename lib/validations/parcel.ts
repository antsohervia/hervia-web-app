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
    .min(1, "Référence requise")
    .max(50, "50 caractères maximum")
    .regex(/^[A-Za-z0-9_-]+$/, "Lettres, chiffres, tirets, underscores"),
  clientId: z
    .string()
    .uuid("Client invalide")
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
