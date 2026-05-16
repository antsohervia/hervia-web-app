"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function FacebookLink({
  linked,
  disabled,
}: {
  linked: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("settings.security.facebook");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLink() {
    setError(null);
    setPending(true);
    const supabase = createSupabaseBrowser();
    const origin = window.location.origin;
    const { error: linkErr } = await supabase.auth.linkIdentity({
      provider: "facebook",
      options: { redirectTo: `${origin}/auth/callback?next=/admin/reglages` },
    });
    if (linkErr) {
      setError(linkErr.message);
      setPending(false);
    }
  }

  if (linked) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-3 text-sm">
        <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
        <span>{t("linked")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <p className="text-sm text-muted-foreground">{t("unlinkedDescription")}</p>
      <Button
        type="button"
        variant="outline"
        onClick={handleLink}
        disabled={pending || disabled}
        className="w-full sm:w-auto"
      >
        {pending ? t("linking") : t("link")}
      </Button>
    </div>
  );
}
