import Link from "next/link";
import {
  ArrowRight,
  Package,
  Palette,
  Tags,
  Users as UsersIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientBrand } from "@/lib/branding/client-theme";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

export default async function TenantAdminHome({ params }: Props) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);
  const t = await getTranslations("dashboard");
  const brand = getClientBrand(session.tenant);

  const admin = createSupabaseAdmin();
  const [parcels, clients, statuses] = await Promise.all([
    admin
      .from("parcels")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.tenant.id),
    admin
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.tenant.id),
    admin
      .from("parcel_statuses")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.tenant.id),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 lg:space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{
          borderColor: brand.palette.border,
          background: `linear-gradient(135deg, color-mix(in srgb, ${brand.primary} 12%, ${brand.palette.card}) 0%, ${brand.palette.card} 70%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-72 rounded-full opacity-30"
          style={{ background: brand.primary, filter: "blur(80px)" }}
        />
        <div className="relative">
          <p
            className="text-xs uppercase tracking-[0.18em] font-semibold"
            style={{ color: brand.primary }}
          >
            {session.tenant.name}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
            {t("welcome", { name: session.fullName ?? session.tenant.name })}
          </h1>
          <p
            className="text-sm mt-1.5 max-w-xl"
            style={{ color: brand.palette.muted }}
          >
            {t("subtitle")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <KpiCard
              label={t("parcels")}
              value={parcels.count ?? 0}
              icon={<Package className="size-4" />}
              tint={`color-mix(in srgb, ${brand.primary} 14%, ${brand.palette.card})`}
              border={`color-mix(in srgb, ${brand.primary} 30%, ${brand.palette.border})`}
              fg={brand.palette.text}
              accent={brand.primary}
            />
            <KpiCard
              label={t("clients")}
              value={clients.count ?? 0}
              icon={<UsersIcon className="size-4" />}
              tint={brand.palette.cardElevated}
              border={brand.palette.border}
              fg={brand.palette.text}
              muted={brand.palette.muted}
            />
            <KpiCard
              label={t("configuredStatuses")}
              value={statuses.count ?? 0}
              icon={<Tags className="size-4" />}
              tint={brand.palette.cardElevated}
              border={brand.palette.border}
              fg={brand.palette.text}
              muted={brand.palette.muted}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <QuickAction
          href="/admin/colis"
          title={t("manageParcels")}
          description={t("manageParcelsDesc")}
          icon={<Package className="size-5" />}
          brand={brand}
        />
        <QuickAction
          href="/admin/statuts"
          title={t("configureStatuses")}
          description={t("configureStatusesDesc")}
          icon={<Tags className="size-5" />}
          brand={brand}
        />
        {session.role === "entreprise_admin" ? (
          <QuickAction
            href="/admin/apparence"
            title={t("appearance")}
            description={t("appearanceDesc")}
            icon={<Palette className="size-5" />}
            brand={brand}
          />
        ) : null}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tint,
  border,
  fg,
  muted,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tint: string;
  border: string;
  fg: string;
  muted?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3.5"
      style={{ background: tint, borderColor: border, color: fg }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: accent ?? muted }}
      >
        {icon}
        {label}
      </div>
      <p className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  brand,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  brand: ReturnType<typeof getClientBrand>;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-sm"
      style={{
        borderColor: brand.palette.border,
        background: brand.palette.card,
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
        style={{ background: brand.primary }}
      />
      <div className="pl-2">
        <div
          className="inline-flex items-center justify-center size-9 rounded-lg mb-3"
          style={{
            background: `color-mix(in srgb, ${brand.primary} 14%, transparent)`,
            color: brand.primary,
          }}
        >
          {icon}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold tracking-tight">{title}</p>
            <p
              className="text-xs sm:text-sm mt-1 line-clamp-2"
              style={{ color: brand.palette.muted }}
            >
              {description}
            </p>
          </div>
          <ArrowRight
            className="size-4 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
            style={{ color: brand.palette.muted }}
          />
        </div>
      </div>
    </Link>
  );
}
