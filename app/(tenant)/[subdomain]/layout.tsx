import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { getImpersonation } from "@/lib/auth/impersonation";
import { getTenantBySubdomain } from "@/lib/tenants/repo";

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();
  if (tenant.status === "deleted") notFound();
  if (tenant.status === "suspended") {
    redirect("/suspended");
  }

  const impersonating = await getImpersonation();
  const isImpersonating = impersonating === tenant.id;

  return (
    <>
      {isImpersonating ? (
        <ImpersonationBanner tenantName={tenant.name} />
      ) : null}
      <div data-readonly={isImpersonating || undefined}>{children}</div>
    </>
  );
}
