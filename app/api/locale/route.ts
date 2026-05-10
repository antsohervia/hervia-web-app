import { NextResponse } from "next/server";
import { isValidLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const locale = body?.locale;

  if (!isValidLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
