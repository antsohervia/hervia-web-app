"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { suspendTenantAction } from "../_actions";
import {
  SUSPENSION_REASON_LABELS,
  SUSPENSION_REASONS,
  type SuspendTenantState,
} from "@/lib/validations/tenant";

export function SuspendDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SuspendTenantState, FormData>(
    suspendTenantAction,
    {},
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Tenant suspendu");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Suspendre</Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="tenantId" value={tenantId} />
          <DialogHeader>
            <DialogTitle>Suspendre le tenant</DialogTitle>
            <DialogDescription>
              {"L'accès est immédiatement bloqué. Les données sont conservées et la suspension est réversible."}
            </DialogDescription>
          </DialogHeader>

          {state?.errors?._form?.[0] ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="reason">Motif</Label>
            <select
              id="reason"
              name="reason"
              defaultValue="impaye"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
              required
            >
              {SUSPENSION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {SUSPENSION_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note interne (optionnelle)</Label>
            <Textarea id="note" name="note" rows={2} maxLength={2000} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message affiché aux utilisateurs (optionnel)
            </Label>
            <Textarea
              id="message"
              name="message"
              rows={3}
              maxLength={2000}
              placeholder="Ce service est temporairement indisponible. Contactez votre support pour plus d'informations."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Suspension..." : "Confirmer la suspension"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
