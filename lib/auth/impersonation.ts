import "server-only";
import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";

const COOKIE = "mt_impersonate";
const TTL_SEC = 60 * 60 * 4; // 4h

export async function setImpersonation(tenantId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: TTL_SEC,
  });
}

export async function clearImpersonation(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function getImpersonation(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}
