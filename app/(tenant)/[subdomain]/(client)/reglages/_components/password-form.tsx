"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChangePasswordState } from "@/lib/validations/password";
import { changePasswordAction } from "../_actions";

type ErrorKey = "wrongCurrent" | "mismatch" | "tooShort" | "sameAsCurrent";

function isErrorKey(value: string | undefined): value is ErrorKey {
  return (
    value === "wrongCurrent" ||
    value === "mismatch" ||
    value === "tooShort" ||
    value === "sameAsCurrent"
  );
}

const errorMessages: Record<ErrorKey, string> = {
  wrongCurrent: "Mot de passe actuel incorrect.",
  mismatch: "Les mots de passe ne correspondent pas.",
  tooShort: "Le mot de passe doit comporter au moins 10 caractères.",
  sameAsCurrent: "Le nouveau mot de passe doit être différent de l'actuel.",
};

export function PasswordForm({ subdomain }: { subdomain: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {},
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Mot de passe modifié avec succès.");
      formRef.current?.reset();
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  function renderFieldError(key: string | undefined) {
    if (!key) return null;
    const message = isErrorKey(key) ? errorMessages[key] : key;
    return <p className="text-xs text-destructive">{message}</p>;
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="subdomain" value={subdomain} />

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">
          Mot de passe actuel <span className="text-destructive">*</span>
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        {renderFieldError(state?.errors?.currentPassword?.[0])}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">
          Nouveau mot de passe <span className="text-destructive">*</span>
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        <p className="text-xs text-muted-foreground">Au moins 10 caractères.</p>
        {renderFieldError(state?.errors?.newPassword?.[0])}
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
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        {renderFieldError(state?.errors?.confirm?.[0])}
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
