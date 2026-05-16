"use client";

import { useState, useActionState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SetupPasswordState } from "@/lib/validations/setup";
import { setupPasswordAction } from "./_actions";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Method = "select" | "password";

export function SetupForm({ subdomain }: { subdomain: string }) {
  const [method, setMethod] = useState<Method>("select");
  const [oauthPending, setOauthPending] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [state, action, pending] = useActionState<SetupPasswordState, FormData>(
    setupPasswordAction,
    {},
  );

  useEffect(() => {
    if (state?.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state?.redirectTo]);

  async function handleSocialLogin(provider: "facebook" | "apple" | "google") {
    setOauthError(null);
    setOauthPending(true);
    const supabase = createSupabaseBrowser();
    const origin = window.location.origin;
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setOauthError(error.message);
      setOauthPending(false);
    }
  }

  if (method === "select") {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        {oauthError ? (
          <Alert variant="destructive">
            <AlertDescription>{oauthError}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={oauthPending}
          onClick={() => handleSocialLogin("google")}
        >
          Continuer avec Google
        </Button>

        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={oauthPending}
          onClick={() => handleSocialLogin("facebook")}
        >
          Continuer avec Facebook
        </Button>

        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={oauthPending}
          onClick={() => handleSocialLogin("apple")}
        >
          Continuer avec Apple
        </Button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={oauthPending}
          onClick={() => setMethod("password")}
        >
          Accéder avec un mot de passe
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <input type="hidden" name="subdomain" value={subdomain} />

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">
          Nouveau mot de passe <span className="text-destructive">*</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
        <p className="text-xs text-muted-foreground">10 caractères minimum.</p>
        {state?.errors?.password?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.password[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">
          Confirmer le mot de passe <span className="text-destructive">*</span>
        </Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
        {state?.errors?.confirm?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.confirm[0]}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Activation..." : "Activer mon compte"}
      </Button>

      <button
        type="button"
        onClick={() => setMethod("select")}
        className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Retour
      </button>
    </form>
  );
}
