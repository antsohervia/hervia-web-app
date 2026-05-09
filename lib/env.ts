function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN ?? "trackapp.com",
  devHost: process.env.NEXT_PUBLIC_DEV_HOST ?? "localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@trackapp.com",
};

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !user || !pass || !from) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    user,
    pass,
    from,
    secure: process.env.SMTP_SECURE === "true",
  };
}

export function getUnsubscribeSecret(): string {
  return required(
    "EMAIL_UNSUBSCRIBE_SECRET",
    process.env.EMAIL_UNSUBSCRIBE_SECRET,
  );
}

export function getServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
