"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAction, type LoginState } from "./_actions";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "Vous n'avez pas accès à cet espace.",
  not_found: "Espace introuvable.",
  callback: "Échec de la connexion. Réessayez.",
  disabled: "Compte désactivé.",
  no_link:
    "Aucun compte administrateur n'est lié à ce compte Google. Demandez une invitation à votre administrateur.",
};

export function LoginForm({
  subdomain,
  initialError,
}: {
  subdomain: string;
  initialError?: string;
}) {
  const initial: LoginState = initialError
    ? { error: ERROR_MESSAGES[initialError] ?? "Accès refusé" }
    : {};
  const [state, action, pending] = useActionState(loginAction, initial);
  const [oauthPending, setOauthPending] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state?.redirectTo]);

  async function handleGoogleLogin() {
    setOauthError(null);
    setOauthPending(true);
    const supabase = createSupabaseBrowser();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/admin` },
    });
    if (error) {
      setOauthError(error.message);
      setOauthPending(false);
    }
  }

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
        disabled={oauthPending || pending}
        onClick={handleGoogleLogin}
      >
        Continuer avec Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="subdomain" value={subdomain} />
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" name="remember" />
            <Label htmlFor="remember" className="text-sm font-normal">
              Se souvenir de moi
            </Label>
          </div>
          <Link
            href="/admin/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Button
          type="submit"
          disabled={pending || oauthPending}
          className="w-full"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
