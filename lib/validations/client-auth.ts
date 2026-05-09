import * as z from "zod";

const passwordRule = z
  .string()
  .min(8, "Au moins 8 caractères")
  .max(72, "72 caractères maximum")
  .regex(/[0-9]/, "Au moins un chiffre")
  .regex(/[A-Za-z]/, "Au moins une lettre");

export const ClientLoginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type ClientLoginInput = z.infer<typeof ClientLoginSchema>;
export type ClientLoginState = {
  error?: string;
  redirectTo?: string;
};

export const ClientSignupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nom requis")
      .max(120, "120 caractères maximum"),
    email: z.string().trim().email("Email invalide"),
    password: passwordRule,
    confirm: z.string(),
    role: z.enum(["importer", "exporter"]),
    phone: z
      .string()
      .trim()
      .max(40, "40 caractères maximum")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),
    company: z
      .string()
      .trim()
      .max(120, "120 caractères maximum")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),
    cgu: z.union([z.literal("on"), z.literal("true")]),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export type ClientSignupInput = z.infer<typeof ClientSignupSchema>;
export type ClientSignupState = {
  errors?: Partial<
    Record<
      | "fullName"
      | "email"
      | "password"
      | "confirm"
      | "role"
      | "phone"
      | "company"
      | "cgu"
      | "_form",
      string[]
    >
  >;
  ok?: boolean;
};

export const ClientForgotPasswordSchema = z.object({
  email: z.string().trim().email("Email invalide"),
});

export type ClientForgotPasswordState = {
  errors?: Partial<Record<"email" | "_form", string[]>>;
  ok?: boolean;
};

export const ClientResetPasswordSchema = z
  .object({
    password: passwordRule,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export type ClientResetPasswordState = {
  errors?: Partial<Record<"password" | "confirm" | "_form", string[]>>;
  redirectTo?: string;
};
