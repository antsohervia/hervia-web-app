import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getSmtpConfig } from "@/lib/env";

let cached: Transporter | null = null;

export function getMailer(): Transporter | null {
  if (cached) return cached;
  const cfg = getSmtpConfig();
  if (!cfg) return null;
  cached = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  return cached;
}

export function getMailerFrom(): string | null {
  return getSmtpConfig()?.from ?? null;
}
