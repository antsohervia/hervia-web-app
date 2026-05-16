import "server-only";
import { getMailer, getMailerFrom } from "./client";

export async function sendTenantInvitationEmail(args: {
  toEmail: string;
  tenantName: string;
  invitationLink: string;
}): Promise<boolean> {
  try {
    const mailer = getMailer();
    const from = getMailerFrom();
    if (!mailer || !from) {
      console.warn("[email] SMTP non configuré, invitation skipée pour", args.toEmail);
      return false;
    }
    const html = `
      <p>Bonjour,</p>
      <p>Vous avez été invité(e) à administrer l'espace <strong>${args.tenantName}</strong> sur MyTransitaire.</p>
      <p><a href="${args.invitationLink}" style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none">Accéder à mon espace</a></p>
      <p style="color:#64748b;font-size:12px">Ce lien est valable 72 heures.</p>
    `;
    const text = `Vous avez été invité(e) à administrer l'espace ${args.tenantName}.\n\nLien d'accès : ${args.invitationLink}\n\nCe lien est valable 72 heures.`;
    await mailer.sendMail({
      from,
      to: args.toEmail,
      subject: `Invitation à rejoindre ${args.tenantName} sur MyTransitaire`,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("[email] Échec envoi invitation tenant", {
      toEmail: args.toEmail,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
