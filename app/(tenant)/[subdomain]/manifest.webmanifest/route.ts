import { buildTenantManifest } from "@/lib/branding/manifest";
import { getTenantBySubdomain } from "@/lib/tenants/repo";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") {
    return new Response(null, { status: 404 });
  }

  const manifest = buildTenantManifest(tenant);
  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
