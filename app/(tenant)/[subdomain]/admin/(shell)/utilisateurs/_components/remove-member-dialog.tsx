"use client";

import { useActionState, useEffect, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import type { RemoveTenantMemberState } from "@/lib/validations/tenant-members";
import { removeTenantMemberAction } from "../_actions";

export function RemoveMemberDialog({
  subdomain,
  memberId,
  email,
}: {
  subdomain: string;
  memberId: string;
  email: string;
}) {
  const t = useTranslations("users");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    RemoveTenantMemberState,
    FormData
  >(removeTenantMemberAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(t("actions.removed"));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 sm:min-h-9 text-destructive hover:text-destructive"
        >
          {t("actions.remove")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          <input type="hidden" name="subdomain" value={subdomain} />
          <input type="hidden" name="memberId" value={memberId} />
          <DialogHeader>
            <DialogTitle>{t("actions.removeTitle")}</DialogTitle>
            <DialogDescription>
              {t("actions.removeDescription", { email })}
            </DialogDescription>
          </DialogHeader>

          {state?.errors?._form?.[0] ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
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
              variant="destructive"
              disabled={pending}
              className="w-full sm:w-auto"
            >
              {pending ? t("actions.removing") : t("actions.remove")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
