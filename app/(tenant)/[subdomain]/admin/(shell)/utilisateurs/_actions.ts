"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  requireTenantAdmin,
  assertNotImpersonatingTenant,
} from "@/lib/auth/tenant-dal";
import { env, isProduction } from "@/lib/env";
import { sendTenantInvitationEmail } from "@/lib/email/send";
import {
  countActiveTenantAdmins,
  findUserAndMembershipByEmail,
  getTenantMember,
} from "@/lib/tenants/members-repo";
import {
  InviteTenantMemberSchema,
  RemoveTenantMemberSchema,
  ResendTenantInvitationSchema,
  UpdateTenantMemberRoleSchema,
  type InviteTenantMemberState,
  type RemoveTenantMemberState,
  type ResendTenantInvitationState,
  type UpdateTenantMemberRoleState,
} from "@/lib/validations/tenant-members";

function tenantOrigin(subdomain: string): string {
  return isProduction()
    ? `https://${subdomain}.${env.appDomain}`
    : `http://${subdomain}.${env.devHost}`;
}

function callbackUrl(subdomain: string): string {
  return `${tenantOrigin(subdomain)}/auth/callback`;
}

async function logTenantMemberAudit(args: {
  actorId: string;
  actorEmail: string | null;
  action: string;
  tenantId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin.from("audit_logs").insert({
    actor_id: args.actorId,
    actor_email: args.actorEmail,
    action: args.action,
    tenant_id: args.tenantId,
    payload: args.payload,
  });
}

export async function inviteTenantMemberAction(
  _prev: InviteTenantMemberState | undefined,
  formData: FormData,
): Promise<InviteTenantMemberState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = InviteTenantMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as InviteTenantMemberState["errors"],
    };
  }
  const { email, role } = parsed.data;

  const { authUser, membership } = await findUserAndMembershipByEmail(
    session.tenant.id,
    email,
  );
  if (membership) {
    return {
      errors: { email: ["Cet email est déjà membre de ce tenant"] },
    };
  }

  const admin = createSupabaseAdmin();
  const redirectTo = callbackUrl(subdomain);

  let userId: string;
  let linkType: "invite" | "magiclink";
  let hashedToken: string;

  if (authUser) {
    // Compte déjà existant (autre tenant, ancien client, etc.) — on attache
    // sans recréer le compte. generateLink({type:"invite"}) refuse les users
    // existants, donc on utilise un magiclink qui peut être vérifié via le
    // callback (verifyOtp supporte le type "magiclink").
    // On ne pose intended_role que si l'utilisateur n'a pas confirmé son
    // email (pas encore de mot de passe / OAuth) — sinon il serait renvoyé
    // sur /admin/setup et écraserait son mot de passe existant.
    const metadataPatch: Record<string, unknown> = {
      tenant_id: session.tenant.id,
      tenant_name: session.tenant.name,
    };
    if (!authUser.emailConfirmedAt) {
      metadataPatch.intended_role = role;
    }
    await admin.auth.admin.updateUserById(authUser.id, {
      user_metadata: { ...authUser.userMetadata, ...metadataPatch },
    });

    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
    if (linkErr || !linkData?.properties?.hashed_token) {
      return {
        errors: {
          _form: [`Échec de l'invitation: ${linkErr?.message ?? "inconnu"}`],
        },
      };
    }
    userId = authUser.id;
    linkType = "magiclink";
    hashedToken = linkData.properties.hashed_token;
  } else {
    // Nouveau compte — flux d'invitation classique qui le crée.
    const inviteMetadata = {
      tenant_id: session.tenant.id,
      intended_role: role,
      tenant_name: session.tenant.name,
    };
    const { data: linkData, error: invErr } =
      await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          redirectTo,
          data: inviteMetadata,
        },
      });
    if (invErr || !linkData?.user || !linkData.properties?.hashed_token) {
      return {
        errors: {
          _form: [`Échec de l'invitation: ${invErr?.message ?? "inconnu"}`],
        },
      };
    }
    await admin.auth.admin.updateUserById(linkData.user.id, {
      user_metadata: {
        ...(linkData.user.user_metadata ?? {}),
        ...inviteMetadata,
      },
    });
    userId = linkData.user.id;
    linkType = "invite";
    hashedToken = linkData.properties.hashed_token;
  }

  const { error: insErr } = await admin.from("tenant_members").insert({
    tenant_id: session.tenant.id,
    user_id: userId,
    role,
    invited_by: session.userId,
  });
  if (insErr) {
    return { errors: { _form: [insErr.message] } };
  }

  const invitationLink = `${redirectTo}?token_hash=${hashedToken}&type=${linkType}`;

  await sendTenantInvitationEmail({
    toEmail: email,
    tenantName: session.tenant.name,
    invitationLink,
  });

  await logTenantMemberAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "tenant_member.invite",
    tenantId: session.tenant.id,
    payload: { invited_email: email, role },
  });

  revalidatePath(`/admin/utilisateurs`);
  return { ok: true, invitationLink, invitedEmail: email };
}

export async function updateTenantMemberRoleAction(
  _prev: UpdateTenantMemberRoleState | undefined,
  formData: FormData,
): Promise<UpdateTenantMemberRoleState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = UpdateTenantMemberRoleSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      errors: tree.fieldErrors as UpdateTenantMemberRoleState["errors"],
    };
  }

  const member = await getTenantMember(session.tenant.id, parsed.data.memberId);
  if (!member) {
    return { errors: { _form: ["Membre introuvable"] } };
  }
  if (member.userId === session.userId) {
    return {
      errors: { _form: ["Vous ne pouvez pas modifier votre propre rôle"] },
    };
  }
  if (member.role === parsed.data.role) {
    return { ok: true };
  }
  if (
    member.role === "entreprise_admin" &&
    parsed.data.role !== "entreprise_admin"
  ) {
    const remaining = await countActiveTenantAdmins(session.tenant.id);
    if (remaining <= 1) {
      return {
        errors: { _form: ["Impossible de dégrader le dernier admin actif"] },
      };
    }
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("tenant_members")
    .update({ role: parsed.data.role })
    .eq("tenant_id", session.tenant.id)
    .eq("id", parsed.data.memberId);
  if (error) {
    return { errors: { _form: [error.message] } };
  }

  await logTenantMemberAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "tenant_member.update_role",
    tenantId: session.tenant.id,
    payload: {
      member_id: parsed.data.memberId,
      user_id: member.userId,
      from: member.role,
      to: parsed.data.role,
    },
  });

  revalidatePath(`/admin/utilisateurs`);
  return { ok: true };
}

export async function removeTenantMemberAction(
  _prev: RemoveTenantMemberState | undefined,
  formData: FormData,
): Promise<RemoveTenantMemberState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = RemoveTenantMemberSchema.safeParse({
    memberId: formData.get("memberId"),
  });
  if (!parsed.success) {
    return { errors: { _form: ["Paramètres invalides"] } };
  }

  const member = await getTenantMember(session.tenant.id, parsed.data.memberId);
  if (!member) {
    return { errors: { _form: ["Membre introuvable"] } };
  }
  if (member.userId === session.userId) {
    return { errors: { _form: ["Vous ne pouvez pas vous retirer vous-même"] } };
  }
  if (member.role === "entreprise_admin") {
    const remaining = await countActiveTenantAdmins(session.tenant.id);
    if (remaining <= 1) {
      return {
        errors: { _form: ["Impossible de retirer le dernier admin actif"] },
      };
    }
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("tenant_members")
    .delete()
    .eq("tenant_id", session.tenant.id)
    .eq("id", parsed.data.memberId);
  if (error) {
    return { errors: { _form: [error.message] } };
  }

  await logTenantMemberAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "tenant_member.remove",
    tenantId: session.tenant.id,
    payload: {
      member_id: parsed.data.memberId,
      user_id: member.userId,
      role: member.role,
    },
  });

  revalidatePath(`/admin/utilisateurs`);
  return { ok: true };
}

export async function resendTenantInvitationAction(
  _prev: ResendTenantInvitationState | undefined,
  formData: FormData,
): Promise<ResendTenantInvitationState> {
  const subdomain = String(formData.get("subdomain") ?? "");
  if (!subdomain) {
    return { errors: { _form: ["Sous-domaine manquant"] } };
  }
  const session = await requireTenantAdmin(subdomain);
  assertNotImpersonatingTenant(session);

  const parsed = ResendTenantInvitationSchema.safeParse({
    memberId: formData.get("memberId"),
  });
  if (!parsed.success) {
    return { errors: { _form: ["Paramètres invalides"] } };
  }

  const member = await getTenantMember(session.tenant.id, parsed.data.memberId);
  if (!member) {
    return { errors: { _form: ["Membre introuvable"] } };
  }

  const admin = createSupabaseAdmin();
  const { data: targetUser, error: getErr } = await admin.auth.admin.getUserById(
    member.userId,
  );
  if (getErr || !targetUser?.user?.email) {
    return { errors: { _form: ["Compte utilisateur introuvable"] } };
  }
  if (targetUser.user.email_confirmed_at) {
    return {
      errors: {
        _form: ["Ce membre a déjà confirmé son compte"],
      },
    };
  }

  const email = targetUser.user.email;
  const redirectTo = callbackUrl(subdomain);

  // S'assurer que les métadonnées tenant restent à jour pour que le callback
  // dirige bien vers /admin/setup si l'utilisateur n'a pas encore de moyen
  // de connexion (mot de passe ou OAuth).
  await admin.auth.admin.updateUserById(member.userId, {
    user_metadata: {
      ...(targetUser.user.user_metadata ?? {}),
      tenant_id: session.tenant.id,
      intended_role: member.role,
      tenant_name: session.tenant.name,
    },
  });

  // generateLink({type:"invite"}) refuse les comptes existants. Le compte
  // ayant déjà été créé lors de la première invitation, on bascule sur un
  // magiclink (verifyOtp côté callback gère ce type).
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

  if (linkErr || !linkData?.properties?.hashed_token) {
    return {
      errors: {
        _form: [`Échec de l'invitation: ${linkErr?.message ?? "inconnu"}`],
      },
    };
  }

  const invitationLink = `${redirectTo}?token_hash=${linkData.properties.hashed_token}&type=magiclink`;

  await sendTenantInvitationEmail({
    toEmail: email,
    tenantName: session.tenant.name,
    invitationLink,
  });

  await logTenantMemberAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "tenant_member.resend_invitation",
    tenantId: session.tenant.id,
    payload: {
      member_id: parsed.data.memberId,
      user_id: member.userId,
      email,
    },
  });

  revalidatePath(`/admin/utilisateurs`);
  return { ok: true, invitationLink, invitedEmail: email };
}
