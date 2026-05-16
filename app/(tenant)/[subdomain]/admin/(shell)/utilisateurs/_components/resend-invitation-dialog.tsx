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
import type { ResendTenantInvitationState } from "@/lib/validations/tenant-members";
import { resendTenantInvitationAction } from "../_actions";
import { InvitationLinkView } from "./invitation-link-view";

export function ResendInvitationDialog({
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
    ResendTenantInvitationState,
    FormData
  >(resendTenantInvitationAction, {});

  useEffect(() => {
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  const success = state?.ok && state.invitationLink && state.invitedEmail;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-11 sm:min-h-9">
          {t("actions.resend")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("invitations.resentTitle")}</DialogTitle>
              <DialogDescription>
                {t("invitations.successDescription")}
              </DialogDescription>
            </DialogHeader>
            <InvitationLinkView
              email={state.invitedEmail!}
              link={state.invitationLink!}
            />
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>
                {t("invitations.close")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form action={action}>
            <input type="hidden" name="subdomain" value={subdomain} />
            <input type="hidden" name="memberId" value={memberId} />
            <DialogHeader>
              <DialogTitle>{t("actions.resendTitle")}</DialogTitle>
              <DialogDescription>
                {t("actions.resendDescription", { email })}
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
                disabled={pending}
                className="w-full sm:w-auto"
              >
                {pending ? t("form.sending") : t("actions.resend")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
