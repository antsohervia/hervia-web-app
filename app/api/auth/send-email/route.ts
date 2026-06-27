import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { env, getAuthEmailHookSecret } from "@/lib/env";
import { verifyStandardWebhook } from "@/lib/email/verify-hook";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { sendRenderedEmail } from "@/lib/email/send";
import {
  renderConfirmationEmail,
  renderRecoveryEmail,
  renderMagicLinkEmail,
  type AuthEmail,
} from "@/lib/email/templates/auth";

// nodemailer (transport SMTP) est Node-only.
export const runtime = "nodejs";

type HookPayload = {
  metadata?: { name?: string };
  user?: {
    email?: string;
    user_metadata?: Record<string, unknown> | null;
  };
  email_data?: {
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
  };
};

/** Réponse d'erreur au format attendu par le Send Email Hook Supabase. */
function hookError(httpCode: number, message: string) {
  return NextResponse.json(
    { error: { http_code: httpCode, message } },
    { status: httpCode },
  );
}

/** email_action_type Supabase → type accepté par verifyOtp côté /auth/callback. */
function toVerifyType(actionType: string): string {
  switch (actionType) {
    case "email_change_current":
    case "email_change_new":
      return "email_change";
    default:
      return actionType;
  }
}

function pickTemplate(
  actionType: string,
  branding: Parameters<typeof renderConfirmationEmail>[0],
  actionUrl: string,
): AuthEmail {
  switch (actionType) {
    case "signup":
      return renderConfirmationEmail(branding, actionUrl);
    case "recovery":
      return renderRecoveryEmail(branding, actionUrl);
    default:
      // invite / magiclink / email_change / email…
      return renderMagicLinkEmail(branding, actionUrl);
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  console.log("[send-email-hook] incoming request, body length:", raw.length);

  const ok = verifyStandardWebhook({
    secret: getAuthEmailHookSecret(),
    id: req.headers.get("webhook-id"),
    timestamp: req.headers.get("webhook-timestamp"),
    signatureHeader: req.headers.get("webhook-signature"),
    body: raw,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!ok) {
    return hookError(401, "Invalid signature");
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(raw) as HookPayload;
  } catch {
    return hookError(400, "Invalid JSON");
  }

  // Hook "before-user-created" → laisser passer (ne bloque pas la création)
  const hookName = payload.metadata?.name;
  if (hookName && hookName !== "send-email") {
    console.log(`[send-email-hook] Hook "${hookName}" ignoré, on laisse passer`);
    return NextResponse.json({ decision: "continue" }, { status: 200 });
  }

  const toEmail = payload.user?.email;
  const tokenHash = payload.email_data?.token_hash;
  const redirectTo = payload.email_data?.redirect_to;
  const actionType = payload.email_data?.email_action_type;

  if (!toEmail || !tokenHash || !redirectTo || !actionType) {
    console.error("[send-email-hook] Missing fields", {
      toEmail: !!toEmail,
      tokenHash: !!tokenHash,
      redirectTo: !!redirectTo,
      actionType: !!actionType,
      hookName,
      payload: JSON.stringify(payload).slice(0, 500),
    });
    return hookError(400, "Missing required email_data fields");
  }

  // Construit le lien d'action : on greffe token_hash + type sur le redirect_to
  // (qui pointe déjà vers /auth/callback, parfois avec ?next=…).
  let actionUrl: string;
  let host: string;
  try {
    const url = new URL(redirectTo);
    host = url.hostname;
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", toVerifyType(actionType));
    actionUrl = url.toString();
  } catch {
    return hookError(400, "Invalid redirect_to");
  }

  // Résolution du tenant pour le branding : metadata d'abord, sinon 1er label
  // du host du redirect_to. Sans tenant (emails plateforme super-admin) on
  // retombe sur un branding par défaut MyTransitaire.
  const meta = (payload.user?.user_metadata ?? {}) as Record<string, unknown>;
  const subdomain =
    (typeof meta.tenant_subdomain === "string" && meta.tenant_subdomain) ||
    host.split(".")[0] ||
    "";

  const tenant = subdomain ? await getTenantBySubdomain(subdomain) : null;
  const branding = tenant
    ? {
        tenantName: tenant.name,
        tenantLogoUrl: tenant.logo_url,
        tenantPrimaryColor: tenant.primary_color,
        supportEmail: env.supportEmail,
      }
    : {
        tenantName: "MyTransitaire",
        tenantLogoUrl: null,
        tenantPrimaryColor: "#0F172A",
        supportEmail: env.supportEmail,
      };

  const email = pickTemplate(actionType, branding, actionUrl);

  // Répondre 200 immédiatement pour respecter le timeout de 5s de Supabase,
  // puis envoyer l'email en arrière-plan via next/server after().
  after(async () => {
    const sent = await sendRenderedEmail({
      toEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if (!sent) {
      console.error("[send-email-hook] Email delivery failed for", toEmail);
    }
  });

  return NextResponse.json({}, { status: 200 });
}
