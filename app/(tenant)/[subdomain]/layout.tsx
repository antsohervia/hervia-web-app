import type { Metadata, Viewport } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { getImpersonation } from "@/lib/auth/impersonation";
import { getClientBrand } from "@/lib/branding/client-theme";
import { getTenantBySubdomain } from "@/lib/tenants/repo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") {
    return {};
  }
  const icon = tenant.logo_url ?? "/hervia-logo.png";
  const brand = getClientBrand(tenant);
  return {
    manifest: "/manifest.webmanifest",
    applicationName: tenant.name,
    appleWebApp: {
      capable: true,
      title: tenant.name,
      statusBarStyle: brand.isDark ? "black-translucent" : "default",
    },
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
  };
}

export async function generateViewport({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Viewport> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant || tenant.status === "deleted") return {};
  const brand = getClientBrand(tenant);
  return {
    themeColor: brand.primary,
  };
}

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
      <ServiceWorkerRegistration />
      {isImpersonating ? (
        <ImpersonationBanner tenantName={tenant.name} />
      ) : null}
      <div data-readonly={isImpersonating || undefined}>{children}</div>
    </>
  );
}
