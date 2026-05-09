import * as z from "zod";

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export type ForgotPasswordState = {
  errors?: Partial<Record<"email" | "_form", string[]>>;
  ok?: boolean;
};

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "Au moins 10 caractères")
      .max(72, "72 caractères maximum"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export type ResetPasswordState = {
  errors?: Partial<Record<"password" | "confirm" | "_form", string[]>>;
  ok?: boolean;
  redirectTo?: string;
};
