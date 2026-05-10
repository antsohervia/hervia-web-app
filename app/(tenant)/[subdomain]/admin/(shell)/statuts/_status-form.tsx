"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PARCEL_STATUS_TYPES,
  PARCEL_STATUS_TYPE_LABELS,
  type StatusFormState,
} from "@/lib/validations/parcel-status";
import type { ParcelStatus } from "@/lib/parcels/repo";
import { createStatusAction, updateStatusAction } from "./_actions";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

type Props =
  | {
      subdomain: string;
      mode: "create";
      onDone: () => void;
      status?: undefined;
    }
  | {
      subdomain: string;
      mode: "edit";
      status: ParcelStatus;
      onDone: () => void;
    };

export function StatusForm(props: Props) {
  const { subdomain, mode, onDone } = props;
  const action = mode === "create" ? createStatusAction : updateStatusAction;
  const [state, formAction, pending] = useActionState<
    StatusFormState,
    FormData
  >(action, {});

  const initial = mode === "edit" ? props.status : null;
  const [color, setColor] = useState(initial?.color ?? "#6B7280");
  const [labelValue, setLabelValue] = useState(initial?.label ?? "");
  const autoCode = useMemo(() => slugify(labelValue), [labelValue]);
  const isSystem = (initial?.system_code ?? null) != null;

  useEffect(() => {
    if (state?.ok) {
      toast.success(mode === "create" ? "Statut créé" : "Statut mis à jour");
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
          value={mode === "create" ? labelValue : undefined}
          defaultValue={mode === "edit" ? initial?.label : undefined}
          onChange={mode === "create" ? (e) => setLabelValue(e.target.value) : undefined}
          maxLength={60}
          required
        />
        {mode === "create" && autoCode ? (
          <p className="text-xs text-muted-foreground">
            Code généré :{" "}
            <span className="font-mono text-foreground">{autoCode}</span>
          </p>
        ) : null}
        {state?.errors?.label?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.label[0]}</p>
        ) : null}
      </div>

      {mode === "create" ? (
        <input type="hidden" name="code" value={autoCode} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="code">
            Code interne <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            name="code"
            defaultValue={initial?.code}
            placeholder="ex: in_customs"
            maxLength={40}
            required
            readOnly={isSystem}
            disabled={isSystem}
          />
          <p className="text-xs text-muted-foreground">
            {isSystem
              ? "Statut système — code et type non modifiables."
              : "Identifiant technique en minuscules (chiffres, lettres et underscores)."}
          </p>
          {state?.errors?.code?.[0] ? (
            <p className="text-xs text-destructive">{state.errors.code[0]}</p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">
            Type <span className="text-destructive">*</span>
          </Label>
          <select
            id="type"
            name="type"
            defaultValue={initial?.type ?? "intermediate"}
            required
            disabled={isSystem}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-60"
          >
            {PARCEL_STATUS_TYPES.map((t) => (
              <option key={t} value={t}>
                {PARCEL_STATUS_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {state?.errors?.type?.[0] ? (
            <p className="text-xs text-destructive">{state.errors.type[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">
            Couleur <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              className="h-9 w-12 rounded-md border cursor-pointer"
              aria-label="Sélecteur de couleur"
            />
            <Input
              id="color"
              name="color"
              value={color}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              className="font-mono"
              required
            />
          </div>
          {state?.errors?.color?.[0] ? (
            <p className="text-xs text-destructive">{state.errors.color[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description interne</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          maxLength={200}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Non visible des clients. 200 caractères max.
        </p>
      </div>

      <div className="rounded-md border p-3 bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Aperçu</p>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: color, color: "#fff" }}
        >
          {initial?.label ?? "Nouveau statut"}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
