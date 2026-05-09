"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChangeStatusState } from "@/lib/validations/parcel";
import { changeParcelStatusAction } from "./_actions";

type StatusOpt = {
  id: string;
  label: string;
  color: string;
  type: "initial" | "intermediate" | "final";
};

type Props = {
  subdomain: string;
  parcelId: string;
  currentStatusId: string | null;
  currentStatusType: "initial" | "intermediate" | "final" | null;
  statuses: StatusOpt[];
  canReopen: boolean;
};

const FORM_ID = "change-status-form";

export function ChangeStatusCard({
  subdomain,
  parcelId,
  currentStatusId,
  currentStatusType,
  statuses,
  canReopen,
}: Props) {
  const [state, action, pending] = useActionState<
    ChangeStatusState,
    FormData
  >(changeParcelStatusAction, {});
  const [statusId, setStatusId] = useState(currentStatusId ?? "");

  useEffect(() => {
    if (state?.ok) toast.success("Statut mis à jour");
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  const isFinal = currentStatusType === "final";
  const target = statuses.find((s) => s.id === statusId);
  const isChanging = statusId && statusId !== currentStatusId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer le statut</CardTitle>
      </CardHeader>
      <CardContent>
        <form id={FORM_ID} action={action} className="space-y-4">
          <input type="hidden" name="subdomain" value={subdomain} />
          <input type="hidden" name="parcelId" value={parcelId} />
          {isFinal ? (
            <input type="hidden" name="forceFinalReopen" value="on" />
          ) : null}

          {isFinal ? (
            <Alert>
              <AlertDescription>
                Ce colis est clôturé.
                {canReopen
                  ? " Vous pouvez le rouvrir en confirmant ci-dessous."
                  : " Seul un administrateur peut le rouvrir."}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusId">Nouveau statut</Label>
              <select
                id="statusId"
                name="statusId"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occurredAt">Date / heure</Label>
              <Input
                id="occurredAt"
                name="occurredAt"
                type="datetime-local"
              />
              <p className="text-xs text-muted-foreground">Vide = maintenant.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (visible du client)</Label>
            <Textarea
              id="comment"
              name="comment"
              maxLength={500}
              rows={3}
              placeholder="Ex. Votre colis est en attente de dédouanement."
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                disabled={!isChanging || (isFinal && !canReopen)}
              >
                <Send className="size-4 mr-1" />
                Mettre à jour
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer le changement</AlertDialogTitle>
                <AlertDialogDescription>
                  Le client sera notifié du passage au statut{" "}
                  <span className="font-medium">{target?.label}</span>.
                  {isFinal
                    ? " Vous rouvrez ce colis clôturé."
                    : ""}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction type="submit" form={FORM_ID} disabled={pending}>
                  {pending ? "..." : "Confirmer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </CardContent>
    </Card>
  );
}
