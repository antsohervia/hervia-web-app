"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAction, type LoginState } from "./_actions";

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "Vous n'avez pas accès à cet espace.",
  not_found: "Espace introuvable.",
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

  useEffect(() => {
    if (state?.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state?.redirectTo]);

  return (
    <form
      action={action}
      className="rounded-lg border bg-card p-6 shadow-sm space-y-4"
    >
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
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
