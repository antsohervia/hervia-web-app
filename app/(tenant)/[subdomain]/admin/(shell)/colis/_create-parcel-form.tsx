"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
type TransportModeOpt = { id: string; label: string };

type Props = {
  subdomain: string;
  defaultCurrency: string;
  initialStatusId: string | null;
  statuses: StatusOpt[];
  transportModes: TransportModeOpt[];
};

const today = () => new Date().toISOString().slice(0, 10);

export function CreateParcelForm({
  subdomain,
  defaultCurrency,
  initialStatusId,
  statuses,
  transportModes,
}: Props) {
  const [state, action, pending] = useActionState<
    CreateParcelState,
    FormData
  >(createParcelAction, {});
  const t = useTranslations("parcels.form");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-4 sm:p-6">
      <input type="hidden" name="subdomain" value={subdomain} />

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reference">
            {t("tracking")} <span className="text-destructive">{tCommon("required")}</span>
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
            {t("shippingDate")} <span className="text-destructive">{tCommon("required")}</span>
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
          <Label htmlFor="transportModeId">{t("transportMode")}</Label>
          <select
            id="transportModeId"
            name="transportModeId"
            defaultValue=""
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">{tCommon("none")}</option>
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
          <p className="text-xs text-muted-foreground">{t("clientNote")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="statusId">
            {t("initialStatus")} <span className="text-destructive">{tCommon("required")}</span>
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
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weightKg">{t("weight")}</Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.001"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volumeM3">{t("volume")}</Label>
          <Input
            id="volumeM3"
            name="volumeM3"
            type="number"
            step="0.001"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDeliveryAt">{t("estimatedDelivery")}</Label>
          <Input
            id="estimatedDeliveryAt"
            name="estimatedDeliveryAt"
            type="date"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedPrice">{t("estimatedPrice")}</Label>
          <Input
            id="estimatedPrice"
            name="estimatedPrice"
            type="number"
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground">{t("priceNote")}</p>
          {state?.errors?.estimatedPrice?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.estimatedPrice[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">{t("currency")}</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={defaultCurrency}
            maxLength={3}
            className="uppercase"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="originCountry">{t("originDestination")}</Label>
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

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? t("creating") : t("create")}
        </Button>
      </div>
    </form>
  );
}
