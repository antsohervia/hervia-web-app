"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateClientState } from "@/lib/validations/client-admin";
import { createClientAction } from "../_actions";

export function CreateClientForm({ subdomain }: { subdomain: string }) {
  const t = useTranslations("clients");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    CreateClientState,
    FormData
  >(createClientAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(t("created"));
      setOpen(false);
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        <Plus className="size-4 mr-1" />
        {t("newClient")}
      </Button>
      <DialogContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="subdomain" value={subdomain} />
          <DialogHeader>
            <DialogTitle>{t("form.title")}</DialogTitle>
            <DialogDescription>{t("form.description")}</DialogDescription>
          </DialogHeader>

          {state?.errors?._form?.[0] ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="fullName">
              {t("form.fullName")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="h-11 sm:h-9 text-base sm:text-sm"
            />
            {state?.errors?.fullName?.[0] ? (
              <p className="text-xs text-destructive">
                {state.errors.fullName[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {t("form.email")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="h-11 sm:h-9 text-base sm:text-sm"
            />
            {state?.errors?.email?.[0] ? (
              <p className="text-xs text-destructive">
                {state.errors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("form.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              className="h-11 sm:h-9 text-base sm:text-sm"
            />
            {state?.errors?.phone?.[0] ? (
              <p className="text-xs text-destructive">
                {state.errors.phone[0]}
              </p>
            ) : null}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("form.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto"
            >
              {pending ? t("form.creating") : t("form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
