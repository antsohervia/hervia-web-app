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
import { Label } from "@/components/ui/label";
import {
  TENANT_MEMBER_ROLES,
  type UpdateTenantMemberRoleState,
} from "@/lib/validations/tenant-members";
import type { TenantMemberRole } from "@/lib/auth/tenant-dal";
import { updateTenantMemberRoleAction } from "../_actions";

export function RoleChangeDialog({
  subdomain,
  memberId,
  email,
  currentRole,
}: {
  subdomain: string;
  memberId: string;
  email: string;
  currentRole: TenantMemberRole;
}) {
  const t = useTranslations("users");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    UpdateTenantMemberRoleState,
    FormData
  >(updateTenantMemberRoleAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(t("actions.roleUpdated"));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-11 sm:min-h-9">
          {t("actions.changeRole")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="subdomain" value={subdomain} />
          <input type="hidden" name="memberId" value={memberId} />
          <DialogHeader>
            <DialogTitle>{t("actions.changeRole")}</DialogTitle>
            <DialogDescription>
              {t("actions.changeRoleFor", { email })}
            </DialogDescription>
          </DialogHeader>

          {state?.errors?._form?.[0] ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`role-${memberId}`}>{t("form.role")}</Label>
            <select
              id={`role-${memberId}`}
              name="role"
              defaultValue={currentRole}
              required
              className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
            >
              {TENANT_MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </select>
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
              {pending ? t("form.saving") : t("form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
