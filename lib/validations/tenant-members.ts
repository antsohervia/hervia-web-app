import * as z from "zod";

export const TENANT_MEMBER_ROLES = [
  "entreprise_admin",
  "entreprise_member",
] as const;

export type TenantMemberRoleInput = (typeof TENANT_MEMBER_ROLES)[number];

export const InviteTenantMemberSchema = z.object({
  email: z.email("Email invalide"),
  role: z.enum(TENANT_MEMBER_ROLES),
});

export type InviteTenantMemberInput = z.infer<typeof InviteTenantMemberSchema>;

export const UpdateTenantMemberRoleSchema = z.object({
  memberId: z.uuid(),
  role: z.enum(TENANT_MEMBER_ROLES),
});

export type UpdateTenantMemberRoleInput = z.infer<
  typeof UpdateTenantMemberRoleSchema
>;

export const RemoveTenantMemberSchema = z.object({
  memberId: z.uuid(),
});

export type RemoveTenantMemberInput = z.infer<typeof RemoveTenantMemberSchema>;

export const ResendTenantInvitationSchema = z.object({
  memberId: z.uuid(),
});

export type ResendTenantInvitationInput = z.infer<
  typeof ResendTenantInvitationSchema
>;

export type InviteTenantMemberState = {
  errors?: Partial<Record<keyof InviteTenantMemberInput, string[]>> & {
    _form?: string[];
  };
  invitationLink?: string;
  invitedEmail?: string;
  ok?: boolean;
};

export type UpdateTenantMemberRoleState = {
  errors?: Partial<Record<keyof UpdateTenantMemberRoleInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};

export type RemoveTenantMemberState = {
  errors?: { _form?: string[] };
  ok?: boolean;
};

export type ResendTenantInvitationState = {
  errors?: { _form?: string[] };
  invitationLink?: string;
  invitedEmail?: string;
  ok?: boolean;
};
