"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddParcelByTrackingState } from "@/lib/validations/parcel";
import { addParcelByTrackingAction } from "./_actions";

type TransportModeOpt = { id: string; label: string };

type Props = {
  subdomain: string;
  transportModes: TransportModeOpt[];
};

export function AddParcelModal({ subdomain, transportModes }: Props) {
  const [open, setOpen] = useState(false);

  if (transportModes.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto min-h-11">
          <Plus className="size-4 mr-1" />
          Ajouter un colis
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un colis</DialogTitle>
          <DialogDescription>
            Saisissez le numéro de tracking transmis par votre transitaire et le
            mode de transport.
          </DialogDescription>
        </DialogHeader>
        <AddParcelForm
          subdomain={subdomain}
          transportModes={transportModes}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddParcelForm({
  subdomain,
  transportModes,
  onDone,
}: Props & { onDone: () => void }) {
  const [state, action, pending] = useActionState<
    AddParcelByTrackingState,
    FormData
  >(addParcelByTrackingAction, {});

  useEffect(() => {
    if (!state?.ok) return;
    if (state.outcome === "created") toast.success("Colis ajouté à votre espace");
    else if (state.outcome === "linked")
      toast.success("Colis associé à votre compte");
    else if (state.outcome === "already_linked")
      toast.message("Ce colis est déjà dans votre espace");
    onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="subdomain" value={subdomain} />

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="reference">
          Numéro de tracking <span className="text-destructive">*</span>
        </Label>
        <Input
          id="reference"
          name="reference"
          required
          maxLength={50}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Ex : ABC123"
          className="h-11 sm:h-9 uppercase"
        />
        {state?.errors?.reference?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.reference[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transportModeId">
          Mode de transport <span className="text-destructive">*</span>
        </Label>
        <select
          id="transportModeId"
          name="transportModeId"
          required
          defaultValue=""
          className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-base sm:text-sm shadow-sm"
        >
          <option value="" disabled>
            Sélectionnez un mode
          </option>
          {transportModes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {state?.errors?.transportModeId?.[0] ? (
          <p className="text-xs text-destructive">
            {state.errors.transportModeId[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="w-full sm:w-auto min-h-11"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto min-h-11"
        >
          {pending ? "Enregistrement..." : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
