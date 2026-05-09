import type { ReactNode } from "react";
import { Package, ShieldCheck, Sparkles } from "lucide-react";
import {
  getClientBrand,
  getClientThemeStyle,
} from "@/lib/branding/client-theme";
import type { TenantDetail } from "@/lib/tenants/repo";

type Props = {
  tenant: Pick<
    TenantDetail,
    "name" | "logo_url" | "theme" | "primary_color" | "secondary_color"
  >;
  title: string;
  subtitle: string;
  children: ReactNode;
  highlight?: string;
};

export function ClientAuthShell({
  tenant,
  title,
  subtitle,
  children,
  highlight,
}: Props) {
  const brand = getClientBrand(tenant);
  const style = getClientThemeStyle(brand);
  const year = new Date().getFullYear();

  return (
    <div
      className={brand.isDark ? "dark min-h-screen" : "min-h-screen"}
      style={style}
    >
      <div
        aria-hidden
        className="h-1 w-full"
        style={{ background: brand.primary }}
      />
      <div className="grid min-h-[calc(100vh-0.25rem)] lg:grid-cols-2">
        <aside
          className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 text-white"
          style={{
            background: `linear-gradient(135deg, ${brand.primary} 0%, ${
              brand.secondary ?? brand.primary
            } 100%)`,
            color: brand.primaryForeground,
          }}
        >
          <div
            aria-hidden
            className="absolute -top-32 -right-24 size-[28rem] rounded-full opacity-20"
            style={{ background: "white", filter: "blur(40px)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-40 -left-20 size-[24rem] rounded-full opacity-15"
            style={{ background: "white", filter: "blur(60px)" }}
          />

          <div className="relative flex items-center gap-3">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-10 w-auto object-contain drop-shadow-sm"
              />
            ) : (
              <div
                className="size-10 rounded-md flex items-center justify-center font-bold"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: brand.primaryForeground,
                }}
              >
                {tenant.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="text-lg font-semibold tracking-tight">
              {tenant.name}
            </span>
          </div>

          <div className="relative space-y-6">
            <h2 className="text-3xl xl:text-4xl font-semibold leading-tight">
              {highlight ?? `Suivez vos expéditions avec ${tenant.name}.`}
            </h2>
            <ul className="space-y-3 text-sm/relaxed opacity-95">
              <li className="flex items-start gap-3">
                <Package className="size-5 shrink-0 mt-0.5" />
                <span>
                  Visualisez l&apos;état de chaque colis en temps réel,
                  référence par référence.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="size-5 shrink-0 mt-0.5" />
                <span>
                  Recevez les mises à jour importantes directement par email.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="size-5 shrink-0 mt-0.5" />
                <span>
                  Un espace privé, sécurisé, et personnalisé aux couleurs
                  de {tenant.name}.
                </span>
              </li>
            </ul>
          </div>

          <div className="relative text-xs opacity-80">
            © {year} {tenant.name}. Tous droits réservés.
          </div>
        </aside>

        <main className="flex flex-col items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
              {tenant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div
                  className="size-10 rounded-md flex items-center justify-center font-bold text-white"
                  style={{ background: brand.primary }}
                >
                  {tenant.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-lg font-semibold tracking-tight">
                {tenant.name}
              </span>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
            </div>

            {children}

            <p className="lg:hidden text-center text-xs text-muted-foreground mt-10">
              © {year} {tenant.name}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
