"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransportModeFormState } from "@/lib/validations/transport-mode";
import type { TransportMode } from "@/lib/transport-modes/repo";
import {
  createTransportModeAction,
  updateTransportModeAction,
} from "./_actions";

type Props =
  | { subdomain: string; mode: "create"; onDone: () => void; record?: undefined }
  | {
      subdomain: string;
      mode: "edit";
      record: TransportMode;
      onDone: () => void;
    };

export function TransportModeForm(props: Props) {
  const { subdomain, mode, onDone } = props;
  const action =
    mode === "create" ? createTransportModeAction : updateTransportModeAction;
  const [state, formAction, pending] = useActionState<
    TransportModeFormState,
    FormData
  >(action, {});

  const initial = mode === "edit" ? props.record : null;

  useEffect(() => {
    if (state?.ok) {
      toast.success(mode === "create" ? "Mode créé" : "Mode mis à jour");
      onDone();
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state, onDone, mode]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="subdomain" value={subdomain} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="label">
          Libellé <span className="text-destructive">*</span>
        </Label>
        <Input
          id="label"
          name="label"
          defaultValue={initial?.label}
          maxLength={60}
          required
          placeholder="Ex : Maritime"
        />
        {state?.errors?.label?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.label[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">
          Code interne <span className="text-destructive">*</span>
        </Label>
        <Input
          id="code"
          name="code"
          defaultValue={initial?.code}
          placeholder="ex: maritime"
          maxLength={40}
          required
        />
        <p className="text-xs text-muted-foreground">
          Identifiant en minuscules (chiffres, lettres, tirets, underscores).
        </p>
        {state?.errors?.code?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.code[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
