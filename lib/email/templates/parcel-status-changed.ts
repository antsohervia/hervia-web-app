import "server-only";
import { isProduction, env } from "@/lib/env";

export type StatusInfo = {
  label: string;
  color: string;
  type: "initial" | "intermediate" | "final";
  position: number;
};

export type StatusChangeEmail = {
  subject: string;
  html: string;
  text: string;
};

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tenantOrigin(subdomain: string): string {
  const host = isProduction() ? env.appDomain : env.devHost;
  return `${isProduction() ? "https" : "http"}://${subdomain}.${host}`;
}

function progressBar(allStatuses: StatusInfo[], currentLabel: string): string {
  if (allStatuses.length === 0) return "";
  const cells = allStatuses
    .map((s, i) => {
      const reached =
        allStatuses.findIndex((x) => x.label === currentLabel) >= i;
      const bg = reached ? s.color : "#E5E7EB";
      return `<td style="height:8px;background:${bg};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>`;
    })
    .join('<td style="width:4px;font-size:0;line-height:0;">&nbsp;</td>');
  return `<table role="presentation" width="100%" style="margin-top:16px;border-collapse:collapse;"><tr>${cells}</tr></table>`;
}

export function renderParcelStatusChangedEmail(input: {
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantPrimaryColor: string;
  tenantSubdomain: string;
  parcelReference: string;
  parcelId: string;
  newStatus: StatusInfo;
  comment: string | null;
  allStatuses: StatusInfo[];
  occurredAt: Date;
  unsubscribeUrl: string;
  supportEmail: string | null;
}): StatusChangeEmail {
  const origin = tenantOrigin(input.tenantSubdomain);
  const parcelUrl = `${origin}/parcels/${input.parcelId}`;

  const subject = `[${input.tenantName}] — Mise à jour de votre colis ${input.parcelReference}`;

  const dateFmt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const occurred = dateFmt.format(input.occurredAt);

  const logoBlock = input.tenantLogoUrl
    ? `<img src="${escape(input.tenantLogoUrl)}" alt="${escape(input.tenantName)}" style="max-height:48px;width:auto;display:block;margin:0 auto 12px auto;" />`
    : "";

  const commentBlock = input.comment
    ? `<p style="margin:16px 0;padding:12px;background:#F9FAFB;border-left:3px solid ${escape(input.tenantPrimaryColor)};color:#374151;">${escape(input.comment)}</p>`
    : "";

  const supportBlock = input.supportEmail
    ? `<p style="margin:0;color:#6B7280;font-size:12px;">Une question ? Contactez ${escape(input.tenantName)} : <a href="mailto:${escape(input.supportEmail)}" style="color:#6B7280;">${escape(input.supportEmail)}</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#F3F4F6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:24px;text-align:center;border-bottom:1px solid #E5E7EB;">
        ${logoBlock}
        <h1 style="margin:0;font-size:18px;font-weight:600;color:#111827;">${escape(input.tenantName)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 8px 0;font-size:14px;color:#6B7280;">Colis <strong style="color:#111827;">${escape(input.parcelReference)}</strong></p>
        <p style="margin:0 0 12px 0;font-size:14px;color:#6B7280;">Nouveau statut au ${escape(occurred)} :</p>
        <div style="display:inline-block;padding:6px 14px;border-radius:999px;color:#FFFFFF;background:${escape(input.newStatus.color)};font-weight:600;font-size:14px;">${escape(input.newStatus.label)}</div>
        ${progressBar(input.allStatuses, input.newStatus.label)}
        ${commentBlock}
        <p style="margin:24px 0 0 0;text-align:center;">
          <a href="${escape(parcelUrl)}" style="display:inline-block;padding:12px 24px;background:${escape(input.tenantPrimaryColor)};color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:600;">Voir le détail de mon colis</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;border-top:1px solid #E5E7EB;background:#F9FAFB;">
        ${supportBlock}
        <p style="margin:8px 0 0 0;color:#9CA3AF;font-size:11px;">
          Vous recevez cet email parce que vous suivez un colis chez ${escape(input.tenantName)}.
          <a href="${escape(input.unsubscribeUrl)}" style="color:#9CA3AF;text-decoration:underline;">Se désinscrire</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${input.tenantName}
Mise à jour de votre colis ${input.parcelReference}

Nouveau statut au ${occurred} : ${input.newStatus.label}
${input.comment ? `\nCommentaire : ${input.comment}\n` : ""}
Voir le détail : ${parcelUrl}

—
Se désinscrire des notifications : ${input.unsubscribeUrl}`;

  return { subject, html, text };
}
