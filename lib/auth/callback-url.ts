import "server-only";
import type { NextRequest } from "next/server";
import { env, isProduction } from "@/lib/env";

function origin(host: string): string {
  return `${isProduction() ? "https" : "http"}://${host}`;
}

// Après un rewrite du proxy, `new URL(req.url).origin` peut être normalisé par
// Next.js et perdre le sous-domaine (retourne `localhost`). On reconstruit
// l'origin depuis le header `Host` qui, lui, est l'host réel envoyé par le
// navigateur — c'est aussi ce sur quoi le proxy s'appuie.
export function requestOrigin(req: NextRequest): string {
  const host = req.headers.get("host") ?? "";
  return origin(host);
}

function rootHost(): string {
  return isProduction() ? env.appDomain : env.devHost;
}

function tenantHost(subdomain: string): string {
  return `${subdomain}.${rootHost()}`;
}

export function buildAdminAuthCallbackUrl(next?: string): string {
  const base = `${origin(rootHost())}/auth/callback`;
  return next ? `${base}?next=${next}` : base;
}

export function buildTenantAuthCallbackUrl(
  subdomain: string,
  next?: string,
): string {
  const base = `${origin(tenantHost(subdomain))}/auth/callback`;
  return next ? `${base}?next=${next}` : base;
}
