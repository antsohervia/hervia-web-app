import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import { buildTenantExportStream } from "@/lib/tenants/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await requirePlatformAdmin();
  const { id } = await ctx.params;

  try {
    const { stream, filename } = await buildTenantExportStream(id);

    const cookieStore = await cookies();
    cookieStore.set(`tenant-export-ok:${id}`, "1", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new NextResponse(`Export failed: ${(e as Error).message}`, {
      status: 503,
    });
  }
}
