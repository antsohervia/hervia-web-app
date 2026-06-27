import * as z from "zod";

export const CreateClientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nom requis")
    .max(120, "120 caractères maximum"),
  email: z.string().trim().email("Email invalide"),
  phone: z
    .string()
    .trim()
    .max(40, "40 caractères maximum")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export type CreateClientState = {
  errors?: Partial<Record<"fullName" | "email" | "phone" | "_form", string[]>>;
  ok?: boolean;
};

export const GenerateRecoveryLinkSchema = z.object({
  clientId: z.string().uuid(),
});

export type GenerateRecoveryLinkState = {
  errors?: { _form?: string[] };
  ok?: boolean;
  recoveryLink?: string;
  clientEmail?: string;
};
