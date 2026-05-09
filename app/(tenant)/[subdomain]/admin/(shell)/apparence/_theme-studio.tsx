"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Send,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
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
  type PublishThemeState,
  type TenantTheme,
} from "@/lib/validations/branding";
import { publishThemeAction } from "./_actions";

const THEME_PALETTE: Record<
  TenantTheme,
  { bg: string; card: string; text: string; muted: string; border: string }
> = {
  light: {
    bg: "#FFFFFF",
    card: "#F8F9FA",
    text: "#1A1A2E",
    muted: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    bg: "#0F1117",
    card: "#1E2130",
    text: "#F1F3F5",
    muted: "#9CA3AF",
    border: "#374151",
  },
  corporate: {
    bg: "#0D1B2A",
    card: "#1B2A3B",
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
  const [state, action, pending] = useActionState<PublishThemeState, FormData>(
    publishThemeAction,
    {},
  );
  const [theme, setTheme] = useState<TenantTheme>(currentTheme);
  const [primary, setPrimary] = useState(currentPrimary);
  const [secondary, setSecondary] = useState(currentSecondary ?? "");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (state?.ok) toast.success("Thème publié");
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  const dirty =
    theme !== currentTheme ||
    primary.toLowerCase() !== currentPrimary.toLowerCase() ||
    (secondary || null) !== (currentSecondary || null);

  const palette = THEME_PALETTE[theme];
  const primaryValid = HEX_COLOR_RX.test(primary);

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
          <div className="flex items-center justify-between mb-2">
            <Label>Aperçu</Label>
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
          </div>
          <div
            className="rounded-md p-4 border transition-colors"
            style={{
              background: palette.bg,
              borderColor: palette.border,
              color: palette.text,
              maxWidth: device === "mobile" ? 360 : "100%",
            }}
          >
            <div
              className="flex items-center justify-between pb-3 mb-3 border-b"
              style={{ borderColor: palette.border }}
            >
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={tenantName}
                    className="h-6 w-auto object-contain"
                  />
                ) : (
                  <span className="font-semibold">{tenantName}</span>
                )}
              </div>
              <span style={{ color: palette.muted }} className="text-xs">
                Espace client
              </span>
            </div>
            <div
              className="rounded-md p-3 mb-3"
              style={{ background: palette.card }}
            >
              <p className="text-sm font-medium">Colis #FR-2026-0421</p>
              <p className="text-xs mt-1" style={{ color: palette.muted }}>
                Marseille → Casablanca
              </p>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: palette.border }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: "70%", background: primary }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: primary,
                    color: contrastWith(primary),
                  }}
                >
                  En transit
                </span>
                {secondary ? (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: secondary,
                      color: contrastWith(secondary),
                    }}
                  >
                    Express
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm font-medium"
              style={{ background: primary, color: contrastWith(primary) }}
            >
              Voir le détail
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!dirty || !primaryValid}>
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
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <form action={action}>
                    <input type="hidden" name="subdomain" value={subdomain} />
                    <input type="hidden" name="theme" value={theme} />
                    <input
                      type="hidden"
                      name="primaryColor"
                      value={primary}
                    />
                    <input
                      type="hidden"
                      name="secondaryColor"
                      value={secondary}
                    />
                    <button type="submit" disabled={pending}>
                      <Check className="size-4 mr-1 inline" />
                      {pending ? "Publication..." : "Publier"}
                    </button>
                  </form>
                </AlertDialogAction>
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
