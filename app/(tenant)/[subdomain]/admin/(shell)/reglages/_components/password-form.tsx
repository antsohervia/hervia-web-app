"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChangePasswordState } from "@/lib/validations/password";
import { changePasswordAction } from "../_actions";

type ErrorKey =
  | "wrongCurrent"
  | "mismatch"
  | "tooShort"
  | "sameAsCurrent";

function isErrorKey(value: string | undefined): value is ErrorKey {
  return (
    value === "wrongCurrent" ||
    value === "mismatch" ||
    value === "tooShort" ||
    value === "sameAsCurrent"
  );
}

export function PasswordForm({
  subdomain,
  disabled,
}: {
  subdomain: string;
  disabled?: boolean;
}) {
  const t = useTranslations("settings.security.password");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePasswordAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(t("saved"));
      formRef.current?.reset();
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state, t]);

  function renderFieldError(key: string | undefined) {
    if (!key) return null;
    const message = isErrorKey(key) ? t(`errors.${key}`) : key;
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
          {t("current")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          disabled={disabled}
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        {renderFieldError(state?.errors?.currentPassword?.[0])}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">
          {t("new")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          disabled={disabled}
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        <p className="text-xs text-muted-foreground">{t("description")}</p>
        {renderFieldError(state?.errors?.newPassword?.[0])}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">
          {t("confirm")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          disabled={disabled}
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        {renderFieldError(state?.errors?.confirm?.[0])}
      </div>

      <Button
        type="submit"
        disabled={pending || disabled}
        className="w-full sm:w-auto"
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
