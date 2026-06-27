// Test SMTP autonome — valide la config M365/GoDaddy avant de brancher le hook.
//
//   node scripts/test-smtp.mjs destinataire@exemple.com
//
// Si aucun destinataire n'est passé, envoie à SMTP_USER (auto-test).
// Lit les variables SMTP_* depuis .env (puis .env.local s'il existe).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import nodemailer from "nodemailer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- Mini-loader .env (sans dépendance) ---
function loadEnv(file) {
  const path = join(root, file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trimStart().startsWith("#")) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnv(".env");
loadEnv(".env.local"); // surcharge éventuelle

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_SECURE = "false",
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].filter(
  (k) => !process.env[k],
);
if (missing.length) {
  console.error("❌ Variables manquantes :", missing.join(", "));
  process.exit(1);
}

const to = "ralisonmendrika@gmail.com";

console.log("→ Host   :", `${SMTP_HOST}:${SMTP_PORT} (secure=${SMTP_SECURE})`);
console.log("→ User   :", SMTP_USER);
console.log("→ From   :", SMTP_FROM);
console.log("→ To     :", to);
console.log("");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === "true",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

try {
  process.stdout.write("1/2 Vérification connexion + auth… ");
  await transporter.verify();
  console.log("✅ OK");

  process.stdout.write("2/2 Envoi du mail de test…        ");
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: "Test SMTP MyTransitaire ✔",
    text: "Si tu lis ceci, l'authentification SMTP M365/GoDaddy fonctionne.",
    html: "<p>Si tu lis ceci, l'authentification <strong>SMTP M365/GoDaddy</strong> fonctionne. ✔</p>",
  });
  console.log("✅ Envoyé");
  console.log("\nmessageId:", info.messageId);
  console.log("response :", info.response);
  console.log("\n👉 Vérifie la boîte de réception (et les spams).");
  process.exit(0);
} catch (err) {
  console.log("❌ ÉCHEC");
  console.error("\n", err?.message ?? err);
  const code = err?.responseCode ?? err?.code;
  if (String(code) === "535" || /authenticate/i.test(err?.message ?? "")) {
    console.error(
      "\n💡 535 = auth refusée. Pistes :\n" +
        "   • SMTP authentifié non activé sur la boîte (admin.microsoft.com → Courrier → Gérer les applications de messagerie)\n" +
        "   • MFA active → il faut un App Password, pas le mot de passe normal\n" +
        "   • Security Defaults bloquent l'auth basique au niveau tenant",
    );
  }
  if (/5\.7\.\d+.*send as|not allowed to send/i.test(err?.message ?? "")) {
    console.error(
      "\n💡 'Send As' refusé : SMTP_FROM ≠ SMTP_USER sans permission Send As, ou propagation en cours (~1h).",
    );
  }
  process.exit(1);
}
