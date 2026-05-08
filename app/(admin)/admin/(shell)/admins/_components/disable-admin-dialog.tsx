"use client";

import { useState } from "react";
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
import { disableAdminAction, reactivateAdminAction } from "../_actions";

export function DisableAdminDialog({
  adminId,
  email,
  disabled,
}: {
  adminId: string;
  email: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = disabled ? reactivateAdminAction : disableAdminAction;
  const verb = disabled ? "Réactiver" : "Désactiver";
  const description = disabled
    ? `Le compte ${email} pourra à nouveau se connecter à la console admin.`
    : `Le compte ${email} sera bloqué immédiatement et ses sessions invalidées.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={disabled ? "default" : "destructive"} size="sm">
          {verb}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          <input type="hidden" name="adminId" value={adminId} />
          <DialogHeader>
            <DialogTitle>{verb} l&apos;administrateur</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant={disabled ? "default" : "destructive"}>
              {verb}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
