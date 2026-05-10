import { NextResponse, type NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";
import { RESERVED_SUBDOMAINS } from "@/lib/validations/tenant";

const APP_DOMAIN = (
  process.env.NEXT_PUBLIC_APP_DOMAIN ?? "trackapp.com"
).toLowerCase();

const RESERVED_SET = new Set<string>(RESERVED_SUBDOMAINS);

function extractSubdomain(host: string): string | null {
  const h = host.toLowerCase().split(":")[0];
  if (h.endsWith(".localhost")) {
    const sub = h.slice(0, -".localhost".length);
    return sub.includes(".") ? null : sub || null;
  }
  if (h === "localhost" || h === "127.0.0.1") return null;
  if (h === APP_DOMAIN) return null;
  if (h.endsWith("." + APP_DOMAIN)) {
    const sub = h.slice(0, -("." + APP_DOMAIN).length);
    return sub.includes(".") ? null : sub || null;
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { response } = await refreshSupabaseSession(request);

  const host = request.headers.get("host") ?? "";
  const sub = extractSubdomain(host);
  const { pathname } = request.nextUrl;

  response.headers.set("x-pathname", pathname);

  // 1) admin.* subdomain → rewrite to /admin/*
  if (sub === "admin") {
    if (!pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url, { headers: response.headers });
    }
    return response;
  }

  // 2) reserved or no subdomain → route normally
  if (!sub || RESERVED_SET.has(sub)) {
    return response;
  }

  // 3) tenant subdomain → rewrite to /[subdomain]/...
  response.headers.set("x-tenant-subdomain", sub);
  // API routes are global — don't prefix them with the subdomain
  if (pathname.startsWith("/api/")) {
    return response;
  }
  const url = request.nextUrl.clone();
  url.pathname = `/${sub}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { headers: response.headers });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$).*)",
  ],
};
