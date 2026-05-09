import "server-only";
import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";

export const REMEMBER_COOKIE = "sb-remember-mode";
const LONG_DAYS = 30;
const SHORT_DAYS = 7;
const DAY_SECONDS = 24 * 60 * 60;

export type RememberMode = "long" | "short";

export function getRememberMaxAge(value: string | undefined | null): number {
  return value === "long" ? LONG_DAYS * DAY_SECONDS : SHORT_DAYS * DAY_SECONDS;
}

export async function setRememberCookie(rememberMe: boolean): Promise<void> {
  const store = await cookies();
  const mode: RememberMode = rememberMe ? "long" : "short";
  store.set(REMEMBER_COOKIE, mode, {
    maxAge: LONG_DAYS * DAY_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
  });
}

export async function clearRememberCookie(): Promise<void> {
  const store = await cookies();
  store.delete(REMEMBER_COOKIE);
}
