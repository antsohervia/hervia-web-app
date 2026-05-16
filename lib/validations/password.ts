import * as z from "zod";

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "wrongCurrent"),
    newPassword: z.string().min(10, "tooShort"),
    confirm: z.string().min(1, "mismatch"),
  })
  .refine((d) => d.newPassword === d.confirm, {
    path: ["confirm"],
    message: "mismatch",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "sameAsCurrent",
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export type ChangePasswordState = {
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirm?: string[];
    _form?: string[];
  };
  ok?: boolean;
};
