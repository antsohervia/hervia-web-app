import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/callback-url";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import {
  getClientById,
  setClientEmailPreference,
} from "@/lib/clients/repo";

function html(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body{margin:0;padding:24px;background:#F3F4F6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;}
    .card{max-width:480px;margin:48px auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,.05);text-align:center;}
    h1{font-size:20px;margin:0 0 12px 0;}
    p{margin:0;color:#4B5563;font-size:14px;line-height:1.5;}
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return html(
      "Lien invalide",
      `<p>Ce lien de désinscription est invalide.</p>`,
    );
  }

  const clientId = verifyUnsubscribeToken(token);
  if (!clientId) {
    return html(
      "Lien invalide",
      `<p>Ce lien de désinscription est invalide ou a été altéré.</p>`,
    );
  }

  const client = await getClientById(clientId);
  if (!client) {
    return html(
      "Lien invalide",
      `<p>Ce lien de désinscription est invalide.</p>`,
    );
  }

  await setClientEmailPreference(clientId, false);

  return html(
    "Désinscription confirmée",
    `<p>Vous ne recevrez plus de notifications email de changement de statut.</p>
     <p style="margin-top:16px;font-size:13px;">
       Vous pouvez réactiver les notifications depuis votre espace en cliquant
       <a href="${origin}/login" style="color:#2563EB;">ici</a>.
     </p>`,
  );
}
