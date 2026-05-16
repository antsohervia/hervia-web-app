"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateProfileState } from "@/lib/validations/profile";
import { updateProfileAction } from "../_actions";

export function ProfileForm({
  subdomain,
  email,
  fullName,
  phone,
  readOnly,
}: {
  subdomain: string;
  email: string;
  fullName: string;
  phone: string;
  readOnly: boolean;
}) {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState<
    UpdateProfileState,
    FormData
  >(updateProfileAction, {});

  useEffect(() => {
    if (state?.ok) toast.success(t("form.saved"));
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state, t]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="subdomain" value={subdomain} />

      {readOnly ? (
        <Alert>
          <AlertDescription>{t("readOnlyNotice")}</AlertDescription>
        </Alert>
      ) : null}

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="fullName">
          {t("form.fullName")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          required
          maxLength={120}
          defaultValue={fullName}
          disabled={readOnly}
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        {state?.errors?.fullName?.[0] ? (
          <p className="text-xs text-destructive">
            {state.errors.fullName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("form.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          readOnly
          disabled
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        <p className="text-xs text-muted-foreground">{t("form.emailHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("form.phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          maxLength={30}
          autoComplete="tel"
          placeholder={t("form.phonePlaceholder")}
          defaultValue={phone}
          disabled={readOnly}
          className="h-11 sm:h-9 text-base sm:text-sm"
        />
        {state?.errors?.phone?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.phone[0]}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending || readOnly}
        className="w-full sm:w-auto"
      >
        {pending ? t("form.saving") : t("form.save")}
      </Button>
    </form>
  );
}
