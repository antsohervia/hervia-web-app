"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  type AdminRole,
} from "@/lib/auth/roles";
import type { UpdateAdminRoleState } from "@/lib/validations/admin";
import { updateAdminRoleAction } from "../_actions";

export function RoleSelectDialog({
  adminId,
  email,
  currentRole,
}: {
  adminId: string;
  email: string;
  currentRole: AdminRole;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    UpdateAdminRoleState,
    FormData
  >(updateAdminRoleAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success("Rôle mis à jour");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Modifier le rôle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="adminId" value={adminId} />
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Compte : <code>{email}</code>
            </DialogDescription>
          </DialogHeader>

          {state?.errors?._form?.[0] ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              name="role"
              defaultValue={currentRole}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
              required
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ADMIN_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
