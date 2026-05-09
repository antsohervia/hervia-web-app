"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ForgotPasswordState } from "@/lib/validations/auth";
import { forgotPasswordAction } from "./_actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<
    ForgotPasswordState,
    FormData
  >(forgotPasswordAction, {});

  if (state?.ok) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <Alert>
          <AlertDescription>
            Si un compte existe pour cet email, vous recevrez un lien de
            réinitialisation dans quelques instants.
          </AlertDescription>
        </Alert>
        <Link
          href="/admin/login"
          className="text-sm underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-lg border bg-card p-6 shadow-sm space-y-4"
    >
      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
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
        {state?.errors?.email?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.email[0]}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
      <div className="text-center">
        <Link
          href="/admin/login"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
