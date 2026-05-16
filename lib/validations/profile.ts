import * as z from "zod";

export const UpdateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nom requis")
    .max(120, "Nom trop long (120 caractères max)"),
  phone: z
    .string()
    .trim()
    .max(30, "Téléphone trop long (30 caractères max)")
    .regex(/^[+0-9 ()\-.]*$/, "Format de téléphone invalide")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export type UpdateProfileState = {
  errors?: Partial<Record<keyof UpdateProfileInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};
