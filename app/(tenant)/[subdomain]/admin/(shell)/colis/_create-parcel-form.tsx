"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateParcelState } from "@/lib/validations/parcel";
import { createParcelAction } from "./_actions";

type StatusOpt = {
  id: string;
  label: string;
  color: string;
  type: "initial" | "intermediate" | "final";
};
type ClientOpt = { id: string; full_name: string; email: string | null };

type Props = {
  subdomain: string;
  defaultCurrency: string;
  initialStatusId: string | null;
  statuses: StatusOpt[];
  clients: ClientOpt[];
};

const today = () => new Date().toISOString().slice(0, 10);

export function CreateParcelForm({
  subdomain,
  defaultCurrency,
  initialStatusId,
  statuses,
  clients,
}: Props) {
  const [state, action, pending] = useActionState<
    CreateParcelState,
    FormData
  >(createParcelAction, {});

  useEffect(() => {
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      <input type="hidden" name="subdomain" value={subdomain} />

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reference">
            Numéro de tracking <span className="text-destructive">*</span>
          </Label>
          <Input
            id="reference"
            name="reference"
            required
            maxLength={50}
            placeholder="FR-2026-0421"
          />
          {state?.errors?.reference?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.reference[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shippedAt">
            Date d&apos;expédition <span className="text-destructive">*</span>
          </Label>
          <Input
            id="shippedAt"
            name="shippedAt"
            type="date"
            defaultValue={today()}
            required
          />
          {state?.errors?.shippedAt?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.shippedAt[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client associé</Label>
          <select
            id="clientId"
            name="clientId"
            defaultValue=""
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">— Aucun (en attente d&apos;affectation) —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
                {c.email ? ` · ${c.email}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="statusId">
            Statut initial <span className="text-destructive">*</span>
          </Label>
          <select
            id="statusId"
            name="statusId"
            defaultValue={initialStatusId ?? ""}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description de la marchandise</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weightKg">Poids (kg)</Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.001"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volumeM3">Volume (m³)</Label>
          <Input
            id="volumeM3"
            name="volumeM3"
            type="number"
            step="0.001"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDeliveryAt">Livraison estimée</Label>
          <Input
            id="estimatedDeliveryAt"
            name="estimatedDeliveryAt"
            type="date"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedPrice">Estimation de prix</Label>
          <Input
            id="estimatedPrice"
            name="estimatedPrice"
            type="number"
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Indicatif, non contractuel.
          </p>
          {state?.errors?.estimatedPrice?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.estimatedPrice[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={defaultCurrency}
            maxLength={3}
            className="uppercase"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="originCountry">Origine / Destination</Label>
          <div className="flex gap-2">
            <Input
              id="originCountry"
              name="originCountry"
              placeholder="FR"
              maxLength={2}
              className="uppercase"
            />
            <Input
              id="destinationCountry"
              name="destinationCountry"
              placeholder="MA"
              maxLength={2}
              className="uppercase"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer le colis"}
        </Button>
      </div>
    </form>
  );
}
