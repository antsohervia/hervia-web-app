import * as z from "zod";

export const SetupPasswordSchema = z
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

export type SetupPasswordInput = z.infer<typeof SetupPasswordSchema>;

export type SetupPasswordState = {
  errors?: Partial<Record<"password" | "confirm" | "_form", string[]>>;
  ok?: boolean;
  redirectTo?: string;
};
