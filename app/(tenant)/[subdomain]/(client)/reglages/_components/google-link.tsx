"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function GoogleLink({ linked }: { linked: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLink() {
    setError(null);
    setPending(true);
    const supabase = createSupabaseBrowser();
    const origin = window.location.origin;
    const { error: linkErr } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/reglages` },
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
        <span>Compte Google lié</span>
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
      <p className="text-sm text-muted-foreground">
        Liez votre compte Google pour vous connecter plus facilement.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={handleLink}
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending ? "Redirection…" : "Lier avec Google"}
      </Button>
    </div>
  );
}
