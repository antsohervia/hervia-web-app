"use client";

import { useEffect, useState, useTransition } from "react";
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
        toast.success("Thème publié");
        setConfirmOpen(false);
      } else if (res?.errors?._form?.[0]) {
        toast.error(res.errors._form[0]);
      } else if (res?.errors) {
        const first = Object.values(res.errors).flat()[0];
        toast.error(first ?? "Erreur de publication");
      } else {
        toast.error("Erreur de publication");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thème et couleurs</CardTitle>
        <CardDescription>
          Trois thèmes prédéfinis. La couleur de marque se superpose au thème.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TENANT_THEMES.map((t) => {
            const isCurrent = t === currentTheme;
            const isSelected = t === theme;
            const tp = THEME_PALETTE[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
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
                    Bouton
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{TENANT_THEME_LABELS[t]}</span>
                  {isCurrent ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                      Actif
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {TENANT_THEME_DESCRIPTIONS[t]}
                </p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">
              Couleur principale <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value.toUpperCase())}
                className="h-9 w-12 rounded-md border cursor-pointer"
                aria-label="Sélecteur couleur principale"
              />
              <Input
                id="primaryColor"
                value={primary}
                onChange={(e) => setPrimary(e.target.value.toUpperCase())}
                placeholder="#1A56DB"
                className="font-mono"
              />
            </div>
            {!primaryValid ? (
              <p className="text-xs text-destructive">
                Format attendu : #RRGGBB
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">
              Couleur secondaire (optionnelle)
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondary || "#FFFFFF"}
                onChange={(e) => setSecondary(e.target.value.toUpperCase())}
                className="h-9 w-12 rounded-md border cursor-pointer"
                aria-label="Sélecteur couleur secondaire"
              />
              <Input
                id="secondaryColor"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value.toUpperCase())}
                placeholder="laisser vide"
                className="font-mono"
              />
              {secondary ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSecondary("")}
                >
                  Effacer
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <Label>Aperçu</Label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md border text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewPage("login")}
                  className={`px-3 py-1 ${
                    previewPage === "login" ? "bg-accent" : ""
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPage("dashboard")}
                  className={`px-3 py-1 border-l ${
                    previewPage === "dashboard" ? "bg-accent" : ""
                  }`}
                >
                  Tableau de bord
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
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice("mobile")}
                    className={`px-3 py-1 border-l ${
                      device === "mobile" ? "bg-accent" : ""
                    }`}
                  >
                    Mobile
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
                Publier ce thème
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la publication</AlertDialogTitle>
                <AlertDialogDescription>
                  Ce changement sera visible immédiatement par tous vos clients.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>
                  Annuler
                </AlertDialogCancel>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={pending}
                >
                  <Check className="size-4 mr-1" />
                  {pending ? "Publication..." : "Publier"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!dirty ? (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <AlertTriangle className="size-3" />
              Aucun changement à publier
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
              Suivez vos expéditions avec {tenantName}.
            </h2>
            <ul className="space-y-2 text-[11px]/relaxed opacity-95">
              <li className="flex items-start gap-2">
                <Package className="size-3.5 shrink-0 mt-0.5" />
                <span>État de chaque colis en temps réel.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="size-3.5 shrink-0 mt-0.5" />
                <span>Mises à jour par email.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="size-3.5 shrink-0 mt-0.5" />
                <span>Espace privé aux couleurs de {tenantName}.</span>
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
              Connexion à votre espace
            </h1>
            <p
              className="text-[11px] mt-1"
              style={{ color: palette.muted }}
            >
              Accédez au suivi de vos colis.
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
                Email
              </div>
              <div
                className="h-7 rounded-md border px-2 flex items-center text-[11px]"
                style={{
                  borderColor: palette.border,
                  background: palette.bg,
                  color: palette.muted,
                }}
              >
                vous@exemple.com
              </div>
            </div>
            <div className="space-y-1">
              <div
                className="text-[10px] font-medium"
                style={{ color: palette.text }}
              >
                Mot de passe
              </div>
              <div
                className="h-7 rounded-md border px-2 flex items-center text-[11px] tracking-widest"
                style={{
                  borderColor: palette.border,
                  background: palette.bg,
                  color: palette.muted,
                }}
              >
                ••••••••
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-sm border"
                  style={{ borderColor: palette.border }}
                />
                <span style={{ color: palette.text }}>Se souvenir de moi</span>
              </div>
              <span
                className="underline-offset-2"
                style={{ color: palette.muted }}
              >
                Mot de passe oublié ?
              </span>
            </div>
            <button
              type="button"
              className="w-full rounded-md py-1.5 text-xs font-medium"
              style={{ background: primary, color: primaryFg }}
            >
              Se connecter
            </button>
            <p
              className="text-center text-[10px]"
              style={{ color: palette.muted }}
            >
              Pas encore de compte ?{" "}
              <span
                className="font-medium"
                style={{ color: palette.text }}
              >
                Créer un compte
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
  const isMobile = device === "mobile";
  const primaryFg = contrastWith(primary);
  const secondaryFg = secondary ? contrastWith(secondary) : null;

  const parcels = [
    {
      ref: "FR-2026-0421",
      desc: "Marseille → Casablanca",
      label: "En transit",
      color: primary,
      date: "Livraison estimée 15/05",
    },
    {
      ref: "FR-2026-0418",
      desc: "Lyon → Dakar",
      label: secondary ? "Express" : "En préparation",
      color: secondary ?? palette.muted,
      date: "Créé le 02/05",
    },
    {
      ref: "FR-2026-0402",
      desc: "Paris → Tunis",
      label: "Livré",
      color: "#10B981",
      date: "Livré le 28/04",
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
              Bonjour, Marie
            </h1>
            <p
              className="text-[11px] mt-1 max-w-sm"
              style={{ color: palette.muted }}
            >
              Vos expéditions confiées à {tenantName} et leur statut.
            </p>

            <div className={`grid grid-cols-3 gap-2 mt-3`}>
              <KpiPreview
                label="Total"
                value={12}
                icon={<Package className="size-3" />}
                tint={palette.cardElevated}
                border={palette.border}
                fg={palette.text}
                muted={palette.muted}
              />
              <KpiPreview
                label="En cours"
                value={4}
                icon={<PackageOpen className="size-3" />}
                tint={`color-mix(in srgb, ${primary} 14%, ${palette.card})`}
                border={`color-mix(in srgb, ${primary} 30%, ${palette.border})`}
                fg={palette.text}
                muted={palette.muted}
                accent={primary}
              />
              <KpiPreview
                label="Livrées"
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
            <h2 className="text-xs font-semibold">Mes expéditions</h2>
            <p className="text-[10px]" style={{ color: palette.muted }}>
              3 expéditions
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
              Rechercher…
            </div>
            <button
              type="button"
              className="rounded-md px-2.5 py-1 text-[10px] font-medium"
              style={{ background: primary, color: primaryFg }}
            >
              Filtrer
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
