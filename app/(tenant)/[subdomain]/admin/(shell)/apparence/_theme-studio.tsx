"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Check,
  Package,
  PackageOpen,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  HEX_COLOR_RX,
  TENANT_THEMES,
  TENANT_THEME_DESCRIPTIONS,
  TENANT_THEME_LABELS,
  type TenantTheme,
} from "@/lib/validations/branding";
import { publishThemeAction } from "./_actions";

const THEME_PALETTE: Record<
  TenantTheme,
  {
    bg: string;
    card: string;
    cardElevated: string;
    text: string;
    muted: string;
    border: string;
  }
> = {
  light: {
    bg: "#FFFFFF",
    card: "#FFFFFF",
    cardElevated: "#F8F9FA",
    text: "#1A1A2E",
    muted: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    bg: "#0F1117",
    card: "#1E2130",
    cardElevated: "#262A3D",
    text: "#F1F3F5",
    muted: "#9CA3AF",
    border: "#374151",
  },
  corporate: {
    bg: "#0D1B2A",
    card: "#1B2A3B",
    cardElevated: "#26384D",
    text: "#FFFFFF",
    muted: "#A8B8C8",
    border: "#2E4057",
  },
};

function contrastWith(hex: string): "#FFFFFF" | "#1A1A2E" {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1A1A2E" : "#FFFFFF";
}

type Props = {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
  currentTheme: TenantTheme;
  currentPrimary: string;
  currentSecondary: string | null;
};

export function ThemeStudio({
  subdomain,
  tenantName,
  logoUrl,
  currentTheme,
  currentPrimary,
  currentSecondary,
}: Props) {
  const t = useTranslations("appearance.theme");
  const tCommon = useTranslations("common");
  const [theme, setTheme] = useState<TenantTheme>(currentTheme);
  const [primary, setPrimary] = useState(currentPrimary);
  const [secondary, setSecondary] = useState(currentSecondary ?? "");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSmallScreen, setIsSmallScreen] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsSmallScreen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const effectiveDevice = isSmallScreen ? "mobile" : device;
  const [previewPage, setPreviewPage] = useState<"login" | "dashboard">(
    "dashboard",
  );
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty =
    theme !== currentTheme ||
    primary.toLowerCase() !== currentPrimary.toLowerCase() ||
    (secondary || null) !== (currentSecondary || null);

  const palette = THEME_PALETTE[theme];
  const primaryValid = HEX_COLOR_RX.test(primary);

  function handlePublish() {
    const fd = new FormData();
    fd.append("subdomain", subdomain);
    fd.append("theme", theme);
    fd.append("primaryColor", primary);
    fd.append("secondaryColor", secondary);
    startTransition(async () => {
      const res = await publishThemeAction(undefined, fd);
      if (res?.ok) {
        toast.success(t("published"));
        setConfirmOpen(false);
      } else if (res?.errors?._form?.[0]) {
        toast.error(res.errors._form[0]);
      } else if (res?.errors) {
        const first = Object.values(res.errors).flat()[0];
        toast.error(first ?? t("publishError"));
      } else {
        toast.error(t("publishError"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TENANT_THEMES.map((th) => {
            const isCurrent = th === currentTheme;
            const isSelected = th === theme;
            const tp = THEME_PALETTE[th];
            return (
              <button
                key={th}
                type="button"
                onClick={() => setTheme(th)}
                className={`text-left rounded-lg border-2 transition p-3 ${
                  isSelected
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                <div
                  className="h-20 rounded-md mb-2 border flex items-center px-3"
                  style={{
                    background: tp.bg,
                    borderColor: tp.border,
                    color: tp.text,
                  }}
                >
                  <div
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{
                      background: primary,
                      color: contrastWith(primary),
                    }}
                  >
                    {t("themeButton")}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{TENANT_THEME_LABELS[th]}</span>
                  {isCurrent ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                      {t("active")}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {TENANT_THEME_DESCRIPTIONS[th]}
                </p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">
              {t("primaryColor")} <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value.toUpperCase())}
                className="h-9 w-12 rounded-md border cursor-pointer"
                aria-label={t("primaryPicker")}
              />
              <Input
                id="primaryColor"
                value={primary}
                onChange={(e) => setPrimary(e.target.value.toUpperCase())}
                placeholder={t("colorPlaceholder")}
                className="font-mono"
              />
            </div>
            {!primaryValid ? (
              <p className="text-xs text-destructive">
                {t("colorFormatError")}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">
              {t("secondaryColor")}
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondary || "#FFFFFF"}
                onChange={(e) => setSecondary(e.target.value.toUpperCase())}
                className="h-9 w-12 rounded-md border cursor-pointer"
                aria-label={t("secondaryPicker")}
              />
              <Input
                id="secondaryColor"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value.toUpperCase())}
                placeholder={t("colorLeaveEmpty")}
                className="font-mono"
              />
              {secondary ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSecondary("")}
                >
                  {t("clear")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <Label>{t("previewLabel")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md border text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewPage("login")}
                  className={`px-3 py-1 ${
                    previewPage === "login" ? "bg-accent" : ""
                  }`}
                >
                  {t("loginTab")}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPage("dashboard")}
                  className={`px-3 py-1 border-l ${
                    previewPage === "dashboard" ? "bg-accent" : ""
                  }`}
                >
                  {t("dashboardTab")}
                </button>
              </div>
              {isSmallScreen === false ? (
                <div className="inline-flex rounded-md border text-xs">
                  <button
                    type="button"
                    onClick={() => setDevice("desktop")}
                    className={`px-3 py-1 ${
                      device === "desktop" ? "bg-accent" : ""
                    }`}
                  >
                    {t("desktop")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice("mobile")}
                    className={`px-3 py-1 border-l ${
                      device === "mobile" ? "bg-accent" : ""
                    }`}
                  >
                    {t("mobile")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {isSmallScreen === null ? (
            <div
              className="rounded-md border bg-muted/30 mx-auto animate-pulse"
              style={{ height: 380 }}
              aria-hidden
            />
          ) : (
          <div
            className="rounded-md border overflow-hidden transition-colors mx-auto"
            style={{
              background: palette.bg,
              borderColor: palette.border,
              color: palette.text,
              maxWidth: effectiveDevice === "mobile" ? 360 : "100%",
            }}
          >
            <div
              aria-hidden
              className="h-1 w-full"
              style={{ background: primary }}
            />
            {previewPage === "login" ? (
              <LoginPreview
                tenantName={tenantName}
                logoUrl={logoUrl}
                palette={palette}
                primary={primary}
                secondary={secondary || null}
                device={effectiveDevice}
              />
            ) : (
              <DashboardPreview
                tenantName={tenantName}
                logoUrl={logoUrl}
                palette={palette}
                primary={primary}
                secondary={secondary || null}
                device={effectiveDevice}
              />
            )}
          </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!dirty || !primaryValid || pending}
                className="w-full sm:w-auto"
              >
                <Send className="size-4 mr-1" />
                {t("publishBtn")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("confirmDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>
                  {tCommon("cancel")}
                </AlertDialogCancel>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={pending}
                >
                  <Check className="size-4 mr-1" />
                  {pending ? t("publishing") : t("publish")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!dirty ? (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <AlertTriangle className="size-3" />
              {t("noChanges")}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type PreviewPalette = (typeof THEME_PALETTE)[TenantTheme];

type PreviewProps = {
  tenantName: string;
  logoUrl: string | null;
  palette: PreviewPalette;
  primary: string;
  secondary: string | null;
  device: "desktop" | "mobile";
};

function LoginPreview({
  tenantName,
  logoUrl,
  palette,
  primary,
  secondary,
  device,
}: PreviewProps) {
  const t = useTranslations("appearance.theme.mock");
  const isMobile = device === "mobile";
  const primaryFg = contrastWith(primary);
  const gradient = `linear-gradient(135deg, ${primary} 0%, ${
    secondary ?? primary
  } 100%)`;

  return (
    <div
      className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}
      style={{ minHeight: isMobile ? 480 : 380 }}
    >
      {!isMobile ? (
        <aside
          className="relative overflow-hidden flex flex-col justify-between p-6"
          style={{ background: gradient, color: primaryFg }}
        >
          <div
            aria-hidden
            className="absolute -top-16 -right-12 size-40 rounded-full opacity-25"
            style={{ background: "white", filter: "blur(30px)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -left-10 size-32 rounded-full opacity-15"
            style={{ background: "white", filter: "blur(40px)" }}
          />

          <div className="relative flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-7 w-auto object-contain drop-shadow-sm"
              />
            ) : (
              <div
                className="size-7 rounded-md flex items-center justify-center text-xs font-bold"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: primaryFg,
                }}
              >
                {tenantName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold tracking-tight">
              {tenantName}
            </span>
          </div>

          <div className="relative space-y-3">
            <h2 className="text-lg font-semibold leading-tight">
              {t("tagline", { tenantName })}
            </h2>
            <ul className="space-y-2 text-[11px]/relaxed opacity-95">
              <li className="flex items-start gap-2">
                <Package className="size-3.5 shrink-0 mt-0.5" />
                <span>{t("bullet1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="size-3.5 shrink-0 mt-0.5" />
                <span>{t("bullet2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="size-3.5 shrink-0 mt-0.5" />
                <span>{t("bullet3", { tenantName })}</span>
              </li>
            </ul>
          </div>

          <div className="relative text-[10px] opacity-80">
            © {new Date().getFullYear()} {tenantName}
          </div>
        </aside>
      ) : null}

      <main className="flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-xs">
          {isMobile ? (
            <div className="mb-5 flex items-center justify-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={tenantName}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <div
                  className="size-7 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: primary, color: primaryFg }}
                >
                  {tenantName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold tracking-tight">
                {tenantName}
              </span>
            </div>
          ) : null}

          <div className="mb-4">
            <h1 className="text-base font-semibold tracking-tight">
              {t("loginTitle")}
            </h1>
            <p
              className="text-[11px] mt-1"
              style={{ color: palette.muted }}
            >
              {t("loginDesc")}
            </p>
          </div>

          <div
            className="rounded-md border p-4 space-y-3"
            style={{ background: palette.card, borderColor: palette.border }}
          >
            <div className="space-y-1">
              <div
                className="text-[10px] font-medium"
                style={{ color: palette.text }}
              >
                {t("email")}
              </div>
              <div
                className="h-7 rounded-md border px-2 flex items-center text-[11px]"
                style={{
                  borderColor: palette.border,
                  background: palette.bg,
                  color: palette.muted,
                }}
              >
                {t("emailPlaceholder")}
              </div>
            </div>
            <div className="space-y-1">
              <div
                className="text-[10px] font-medium"
                style={{ color: palette.text }}
              >
                {t("password")}
              </div>
              <div
                className="h-7 rounded-md border px-2 flex items-center text-[11px] tracking-widest"
                style={{
                  borderColor: palette.border,
                  background: palette.bg,
                  color: palette.muted,
                }}
              >
                {t("passwordPlaceholder")}
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-sm border"
                  style={{ borderColor: palette.border }}
                />
                <span style={{ color: palette.text }}>{t("remember")}</span>
              </div>
              <span
                className="underline-offset-2"
                style={{ color: palette.muted }}
              >
                {t("forgotPassword")}
              </span>
            </div>
            <button
              type="button"
              className="w-full rounded-md py-1.5 text-xs font-medium"
              style={{ background: primary, color: primaryFg }}
            >
              {t("signIn")}
            </button>
            <p
              className="text-center text-[10px]"
              style={{ color: palette.muted }}
            >
              {t("noAccount")}{" "}
              <span
                className="font-medium"
                style={{ color: palette.text }}
              >
                {t("createAccount")}
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardPreview({
  tenantName,
  logoUrl,
  palette,
  primary,
  secondary,
  device,
}: PreviewProps) {
  const t = useTranslations("appearance.theme.mock");
  const isMobile = device === "mobile";
  const primaryFg = contrastWith(primary);
  const secondaryFg = secondary ? contrastWith(secondary) : null;

  const parcels = [
    {
      ref: "FR-2026-0421",
      desc: "Marseille → Casablanca",
      label: t("statusInTransit"),
      color: primary,
      date: t("dateEstimated"),
    },
    {
      ref: "FR-2026-0418",
      desc: "Lyon → Dakar",
      label: secondary ? t("statusExpress") : t("statusInPrep"),
      color: secondary ?? palette.muted,
      date: t("dateCreated"),
    },
    {
      ref: "FR-2026-0402",
      desc: "Paris → Tunis",
      label: t("statusDelivered"),
      color: "#10B981",
      date: t("dateDelivered"),
    },
  ];

  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: palette.border, background: palette.card }}
      >
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={tenantName}
              className="h-5 w-auto object-contain"
            />
          ) : (
            <span className="text-sm font-semibold">{tenantName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span style={{ color: palette.muted }}>Marie D.</span>
          <span
            className="size-5 rounded-full flex items-center justify-center font-medium"
            style={{
              background: `color-mix(in srgb, ${primary} 18%, transparent)`,
              color: primary,
            }}
          >
            M
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <section
          className="relative overflow-hidden rounded-xl border p-4"
          style={{
            borderColor: palette.border,
            background: `linear-gradient(135deg, color-mix(in srgb, ${primary} 14%, ${palette.card}) 0%, ${palette.card} 70%)`,
          }}
        >
          <div
            aria-hidden
            className="absolute -top-12 -right-10 size-28 rounded-full opacity-30"
            style={{ background: primary, filter: "blur(40px)" }}
          />
          <div className="relative">
            <p
              className="text-[10px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: primary }}
            >
              {tenantName}
            </p>
            <h1 className="text-base font-semibold tracking-tight mt-1">
              {t("greeting")}
            </h1>
            <p
              className="text-[11px] mt-1 max-w-sm"
              style={{ color: palette.muted }}
            >
              {t("subtitle", { tenantName })}
            </p>

            <div className={`grid grid-cols-3 gap-2 mt-3`}>
              <KpiPreview
                label={t("kpiTotal")}
                value={12}
                icon={<Package className="size-3" />}
                tint={palette.cardElevated}
                border={palette.border}
                fg={palette.text}
                muted={palette.muted}
              />
              <KpiPreview
                label={t("kpiOngoing")}
                value={4}
                icon={<PackageOpen className="size-3" />}
                tint={`color-mix(in srgb, ${primary} 14%, ${palette.card})`}
                border={`color-mix(in srgb, ${primary} 30%, ${palette.border})`}
                fg={palette.text}
                muted={palette.muted}
                accent={primary}
              />
              <KpiPreview
                label={t("kpiDelivered")}
                value={8}
                icon={<CheckCircle2 className="size-3" />}
                tint={palette.cardElevated}
                border={palette.border}
                fg={palette.text}
                muted={palette.muted}
              />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <h2 className="text-xs font-semibold">{t("shipments")}</h2>
            <p className="text-[10px]" style={{ color: palette.muted }}>
              {t("count")}
            </p>
          </div>

          <div
            className="flex items-center gap-2 rounded-lg border p-2"
            style={{ borderColor: palette.border, background: palette.card }}
          >
            <div
              className="flex-1 h-6 rounded-md border flex items-center px-2 gap-1.5 text-[10px]"
              style={{
                borderColor: palette.border,
                color: palette.muted,
                background: palette.bg,
              }}
            >
              <Search className="size-3" />
              {t("search")}
            </div>
            <button
              type="button"
              className="rounded-md px-2.5 py-1 text-[10px] font-medium"
              style={{ background: primary, color: primaryFg }}
            >
              {t("filter")}
            </button>
          </div>

          <ul className="space-y-1.5">
            {(isMobile ? parcels.slice(0, 2) : parcels).map((p) => (
              <li
                key={p.ref}
                className="relative flex items-center gap-3 rounded-lg border px-3 py-2"
                style={{
                  borderColor: palette.border,
                  background: palette.card,
                }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                  style={{ background: p.color }}
                />
                <div className="flex-1 min-w-0 pl-1.5">
                  <p className="text-[11px] font-semibold tracking-tight truncate">
                    {p.ref}
                  </p>
                  <p
                    className="text-[10px] truncate"
                    style={{ color: palette.muted }}
                  >
                    {p.desc} · {p.date}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${p.color} 16%, transparent)`,
                    color: p.color === secondary ? secondaryFg ?? p.color : p.color,
                    border: `1px solid color-mix(in srgb, ${p.color} 35%, transparent)`,
                  }}
                >
                  <span
                    className="size-1 rounded-full"
                    style={{ background: p.color }}
                  />
                  {p.label}
                </span>
                <ArrowRight
                  className="size-3 shrink-0"
                  style={{ color: palette.muted }}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function KpiPreview({
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
  muted: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-md border px-2 py-1.5"
      style={{ background: tint, borderColor: border, color: fg }}
    >
      <div
        className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider"
        style={{ color: accent ?? muted }}
      >
        {icon}
        {label}
      </div>
      <p className="text-base font-semibold tracking-tight mt-0.5">{value}</p>
    </div>
  );
}
