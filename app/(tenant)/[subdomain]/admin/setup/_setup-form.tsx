"use client";

import { useActionState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SetupPasswordState } from "@/lib/validations/setup";
import { setupPasswordAction } from "./_actions";

export function SetupForm({ subdomain }: { subdomain: string }) {
  const [state, action, pending] = useActionState<
    SetupPasswordState,
    FormData
  >(setupPasswordAction, {});

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
          <p className="text-xs text-destructive">
            {state.errors.password[0]}
          </p>
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
          <p className="text-xs text-destructive">
            {state.errors.confirm[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Activation..." : "Activer mon compte"}
      </Button>
    </form>
  );
}
