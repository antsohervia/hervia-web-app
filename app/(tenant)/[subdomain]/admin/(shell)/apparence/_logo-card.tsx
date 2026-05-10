"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Upload, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LOGO_ACCEPTED_EXT,
  type LogoState,
} from "@/lib/validations/branding";
import { resetLogoAction, uploadLogoAction } from "./_actions";

type Props = {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
};

export function LogoCard({ subdomain, tenantName, logoUrl }: Props) {
  const t = useTranslations("appearance.logo");
  const [state, action, pending] = useActionState<LogoState, FormData>(
    uploadLogoAction,
    {},
  );
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(t("updated"));
      if (inputRef.current) inputRef.current.value = "";
      queueMicrotask(() => setPreview(null));
    }
    if (state?.error) toast.error(state.error);
  }, [state, t]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return setPreview(null);
    setPreview(URL.createObjectURL(file));
  }

  const display = preview ?? logoUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-md border bg-white p-6 flex items-center justify-center min-h-32">
            {display ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={display}
                alt={tenantName}
                className="max-h-20 w-auto object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("lightPreview")}
              </span>
            )}
          </div>
          <div className="rounded-md border bg-slate-900 p-6 flex items-center justify-center min-h-32">
            {display ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={display}
                alt={tenantName}
                className="max-h-20 w-auto object-contain"
              />
            ) : (
              <span className="text-xs text-slate-400">
                {t("darkPreview")}
              </span>
            )}
          </div>
        </div>

        <form action={action} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="subdomain" value={subdomain} />
          <input
            ref={inputRef}
            type="file"
            name="logo"
            accept={LOGO_ACCEPTED_EXT.join(",")}
            onChange={onFileChange}
            className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm hover:file:bg-accent"
          />
          <Button type="submit" disabled={pending || !preview}>
            <Upload className="size-4 mr-1" />
            {pending ? t("uploading") : t("save")}
          </Button>
        </form>

        {logoUrl ? (
          <form action={resetLogoAction}>
            <input type="hidden" name="subdomain" value={subdomain} />
            <Button type="submit" variant="ghost" size="sm">
              <RotateCcw className="size-4 mr-1" />
              {t("reset")}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
