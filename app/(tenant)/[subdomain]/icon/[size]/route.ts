import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getTenantBySubdomain } from "@/lib/tenants/repo";

const ALLOWED_SIZES = new Set([192, 512]);
const FALLBACK_PATH = path.join(process.cwd(), "public", "hervia-logo.png");

export async function GET(
  _req: Request,
  {
    params,
  }: { params: Promise<{ subdomain: string; size: string }> },
) {
  const { subdomain, size } = await params;
  const sizeNum = Number.parseInt(size, 10);
  if (!ALLOWED_SIZES.has(sizeNum)) {
    return new Response(null, { status: 404 });
  }

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") {
    return new Response(null, { status: 404 });
  }

  let source: Buffer;
  try {
    if (tenant.logo_url) {
      const res = await fetch(tenant.logo_url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`);
      source = Buffer.from(await res.arrayBuffer());
    } else {
      source = await readFile(FALLBACK_PATH);
    }
  } catch {
    source = await readFile(FALLBACK_PATH);
  }

  const png = await sharp(source)
    .resize(sizeNum, sizeNum, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
