import * as z from "zod";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export const CreateAdminSchema = z.object({
  email: z.email("Email invalide"),
  role: z.enum(ADMIN_ROLES),
});
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;

export const UpdateAdminRoleSchema = z.object({
  adminId: z.uuid(),
  role: z.enum(ADMIN_ROLES),
});
export type UpdateAdminRoleInput = z.infer<typeof UpdateAdminRoleSchema>;

export const DisableAdminSchema = z.object({
  adminId: z.uuid(),
});
export type DisableAdminInput = z.infer<typeof DisableAdminSchema>;

export const ReactivateAdminSchema = z.object({
  adminId: z.uuid(),
});
export type ReactivateAdminInput = z.infer<typeof ReactivateAdminSchema>;

export type CreateAdminState = {
  errors?: Partial<Record<keyof CreateAdminInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export type UpdateAdminRoleState = {
  errors?: Partial<Record<keyof UpdateAdminRoleInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};
