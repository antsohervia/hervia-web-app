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
import {
  TENANT_MEMBER_ROLES,
  type InviteTenantMemberState,
} from "@/lib/validations/tenant-members";
import { inviteTenantMemberAction } from "../_actions";
import { InvitationLinkView } from "./invitation-link-view";

export function InviteForm({ subdomain }: { subdomain: string }) {
  const t = useTranslations("users");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    InviteTenantMemberState,
    FormData
  >(inviteTenantMemberAction, {});

  useEffect(() => {
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
  }

  const success = state?.ok && state.invitationLink && state.invitedEmail;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        <Plus className="size-4 mr-1" />
        {t("invite")}
      </Button>
      <DialogContent>
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("invitations.successTitle")}</DialogTitle>
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
          <form action={action} className="space-y-4">
            <input type="hidden" name="subdomain" value={subdomain} />
            <DialogHeader>
              <DialogTitle>{t("inviteTitle")}</DialogTitle>
              <DialogDescription>
                {t("inviteDescription")}
              </DialogDescription>
            </DialogHeader>

            {state?.errors?._form?.[0] ? (
              <Alert variant="destructive">
                <AlertDescription>{state.errors._form[0]}</AlertDescription>
              </Alert>
            ) : null}

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
              <Label htmlFor="role">
                {t("form.role")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <select
                id="role"
                name="role"
                defaultValue="entreprise_member"
                required
                className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
              >
                {TENANT_MEMBER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}`)}
                  </option>
                ))}
              </select>
              {state?.errors?.role?.[0] ? (
                <p className="text-xs text-destructive">
                  {state.errors.role[0]}
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
                {pending ? t("form.sending") : t("form.send")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
