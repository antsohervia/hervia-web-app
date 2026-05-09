"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
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
import type { UpdateParcelState } from "@/lib/validations/parcel";
import { updateParcelAction } from "./_actions";

type TransportModeOpt = { id: string; label: string };

type Props = {
  subdomain: string;
  parcelId: string;
  defaultCurrency: string;
  transportModes: TransportModeOpt[];
  initial: {
    transport_mode_id: string | null;
    description: string | null;
    weight_kg: number | null;
    volume_m3: number | null;
    estimated_price: number | null;
    currency: string | null;
    origin_country: string | null;
    destination_country: string | null;
    shipped_at: string | null;
    estimated_delivery_at: string | null;
  };
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function EditParcelCard({
  subdomain,
  parcelId,
  defaultCurrency,
  transportModes,
  initial,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<UpdateParcelState["errors"]>();

  function handleSubmit(formData: FormData) {
    formData.append("subdomain", subdomain);
    formData.append("parcelId", parcelId);
    setErrors(undefined);
    startTransition(async () => {
      const res = await updateParcelAction(undefined, formData);
      if (res?.ok) {
        toast.success("Colis mis à jour");
        setEditing(false);
      } else {
        setErrors(res?.errors);
        const formErr = res?.errors?._form?.[0];
        if (formErr) toast.error(formErr);
        else toast.error("Échec de la mise à jour");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Détails de l&apos;expédition</CardTitle>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4 mr-1" />
            Modifier
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false);
              setErrors(undefined);
            }}
            disabled={pending}
          >
            <X className="size-4 mr-1" />
            Annuler
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!editing ? (
          <p className="text-sm text-muted-foreground">
            Cliquez sur &quot;Modifier&quot; pour compléter ou corriger les
            informations de transport, dimensions, estimation, dates et
            origine/destination.
          </p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            {errors?._form?.[0] ? (
              <Alert variant="destructive">
                <AlertDescription>{errors._form[0]}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transportModeId">Mode de transport</Label>
                <select
                  id="transportModeId"
                  name="transportModeId"
                  defaultValue={initial.transport_mode_id ?? ""}
                  className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
                >
                  <option value="">— Aucun —</option>
                  {transportModes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                {errors?.transportModeId?.[0] ? (
                  <p className="text-xs text-destructive">
                    {errors.transportModeId[0]}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippedAt">Date d&apos;expédition</Label>
                <Input
                  id="shippedAt"
                  name="shippedAt"
                  type="date"
                  defaultValue={toDateInput(initial.shipped_at)}
                />
                {errors?.shippedAt?.[0] ? (
                  <p className="text-xs text-destructive">
                    {errors.shippedAt[0]}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description de la marchandise</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={initial.description ?? ""}
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
                  defaultValue={initial.weight_kg ?? ""}
                />
                {errors?.weightKg?.[0] ? (
                  <p className="text-xs text-destructive">
                    {errors.weightKg[0]}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="volumeM3">Volume (m³)</Label>
                <Input
                  id="volumeM3"
                  name="volumeM3"
                  type="number"
                  step="0.001"
                  min="0"
                  defaultValue={initial.volume_m3 ?? ""}
                />
                {errors?.volumeM3?.[0] ? (
                  <p className="text-xs text-destructive">
                    {errors.volumeM3[0]}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryAt">Livraison estimée</Label>
                <Input
                  id="estimatedDeliveryAt"
                  name="estimatedDeliveryAt"
                  type="date"
                  defaultValue={toDateInput(initial.estimated_delivery_at)}
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
                  defaultValue={initial.estimated_price ?? ""}
                />
                {errors?.estimatedPrice?.[0] ? (
                  <p className="text-xs text-destructive">
                    {errors.estimatedPrice[0]}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Indicatif, non contractuel.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Input
                  id="currency"
                  name="currency"
                  defaultValue={initial.currency ?? defaultCurrency}
                  maxLength={3}
                  className="uppercase"
                />
                {errors?.currency?.[0] ? (
                  <p className="text-xs text-destructive">
                    {errors.currency[0]}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Origine / Destination</Label>
                <div className="flex gap-2">
                  <Input
                    id="originCountry"
                    name="originCountry"
                    placeholder="FR"
                    maxLength={2}
                    className="uppercase"
                    defaultValue={initial.origin_country ?? ""}
                  />
                  <Input
                    id="destinationCountry"
                    name="destinationCountry"
                    placeholder="MA"
                    maxLength={2}
                    className="uppercase"
                    defaultValue={initial.destination_country ?? ""}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setErrors(undefined);
                }}
                disabled={pending}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
