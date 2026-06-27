import "server-only";

export type AuthEmail = {
  subject: string;
  html: string;
  text: string;
};

type Branding = {
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantPrimaryColor: string;
  supportEmail: string | null;
};

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Coque HTML commune à tous les emails d'authentification. */
function layout(
  b: Branding,
  args: {
    heading: string;
    bodyHtml: string;
    actionUrl: string;
    actionLabel: string;
    footerNote: string;
  },
): string {
  const color = b.tenantPrimaryColor || "#0F172A";
  const logoBlock = b.tenantLogoUrl
    ? `<img src="${escape(b.tenantLogoUrl)}" alt="${escape(b.tenantName)}" style="max-height:48px;width:auto;display:block;margin:0 auto 12px auto;" />`
    : "";
  const supportBlock = b.supportEmail
    ? `<p style="margin:0;color:#6B7280;font-size:12px;">Une question ? Contactez ${escape(b.tenantName)} : <a href="mailto:${escape(b.supportEmail)}" style="color:#6B7280;">${escape(b.supportEmail)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#F3F4F6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:24px;text-align:center;border-bottom:1px solid #E5E7EB;">
        ${logoBlock}
        <h1 style="margin:0;font-size:18px;font-weight:600;color:#111827;">${escape(b.tenantName)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <h2 style="margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;">${escape(args.heading)}</h2>
        ${args.bodyHtml}
        <p style="margin:24px 0 0 0;text-align:center;">
          <a href="${escape(args.actionUrl)}" style="display:inline-block;padding:12px 24px;background:${escape(color)};color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:600;">${escape(args.actionLabel)}</a>
        </p>
        <p style="margin:24px 0 0 0;font-size:12px;color:#9CA3AF;word-break:break-all;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
          <a href="${escape(args.actionUrl)}" style="color:#9CA3AF;">${escape(args.actionUrl)}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;border-top:1px solid #E5E7EB;background:#F9FAFB;">
        ${supportBlock}
        <p style="margin:8px 0 0 0;color:#9CA3AF;font-size:11px;">${escape(args.footerNote)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function textBody(args: {
  tenantName: string;
  lines: string[];
  actionUrl: string;
}): string {
  return `${args.tenantName}\n\n${args.lines.join("\n")}\n\n${args.actionUrl}\n`;
}

/** Confirmation d'inscription (email_action_type = "signup"). */
export function renderConfirmationEmail(
  b: Branding,
  actionUrl: string,
): AuthEmail {
  return {
    subject: `Confirmez votre inscription — ${b.tenantName}`,
    html: layout(b, {
      heading: "Bienvenue !",
      bodyHtml: `<p style="margin:0;font-size:14px;color:#374151;">Merci de votre inscription chez <strong>${escape(b.tenantName)}</strong>. Confirmez votre adresse email pour activer votre compte.</p>`,
      actionUrl,
      actionLabel: "Confirmer mon email",
      footerNote: `Vous recevez cet email car un compte a été créé avec cette adresse chez ${b.tenantName}. Si ce n'est pas vous, ignorez ce message.`,
    }),
    text: textBody({
      tenantName: b.tenantName,
      lines: [
        `Merci de votre inscription chez ${b.tenantName}.`,
        "Confirmez votre adresse email pour activer votre compte :",
      ],
      actionUrl,
    }),
  };
}

/** Réinitialisation de mot de passe (email_action_type = "recovery"). */
export function renderRecoveryEmail(
  b: Branding,
  actionUrl: string,
): AuthEmail {
  return {
    subject: `Réinitialisation de votre mot de passe — ${b.tenantName}`,
    html: layout(b, {
      heading: "Réinitialisation du mot de passe",
      bodyHtml: `<p style="margin:0;font-size:14px;color:#374151;">Vous avez demandé à réinitialiser votre mot de passe sur l'espace <strong>${escape(b.tenantName)}</strong>. Cliquez ci-dessous pour en choisir un nouveau.</p>`,
      actionUrl,
      actionLabel: "Choisir un nouveau mot de passe",
      footerNote: `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.`,
    }),
    text: textBody({
      tenantName: b.tenantName,
      lines: [
        "Vous avez demandé à réinitialiser votre mot de passe.",
        "Choisissez un nouveau mot de passe ici :",
      ],
      actionUrl,
    }),
  };
}

/**
 * Email générique à lien magique : couvre invite / magiclink / email_change.
 * Garantit qu'aucun email auth ne « fuit » vers le template Supabase par défaut.
 */
export function renderMagicLinkEmail(
  b: Branding,
  actionUrl: string,
): AuthEmail {
  return {
    subject: `Votre lien de connexion — ${b.tenantName}`,
    html: layout(b, {
      heading: "Votre lien sécurisé",
      bodyHtml: `<p style="margin:0;font-size:14px;color:#374151;">Cliquez ci-dessous pour continuer sur l'espace <strong>${escape(b.tenantName)}</strong>.</p>`,
      actionUrl,
      actionLabel: "Continuer",
      footerNote: `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    }),
    text: textBody({
      tenantName: b.tenantName,
      lines: [`Cliquez pour continuer sur l'espace ${b.tenantName} :`],
      actionUrl,
    }),
  };
}
