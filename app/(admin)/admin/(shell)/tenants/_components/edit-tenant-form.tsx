"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SUPPORTED_TIMEZONES,
  type UpdateTenantState,
} from "@/lib/validations/tenant";
import { updateTenantAction } from "../_actions";

const COUNTRIES: { code: string; name: string }[] = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "LU", name: "Luxembourg" },
  { code: "MA", name: "Maroc" },
  { code: "DZ", name: "Algérie" },
  { code: "TN", name: "Tunisie" },
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CM", name: "Cameroun" },
];

const CURRENCIES = ["EUR", "USD", "CHF", "MAD", "DZD", "TND", "XOF", "XAF"];

export type EditTenantInitial = {
  id: string;
  subdomain: string;
  name: string;
  adminEmail: string;
  country: string;
  defaultCurrency: string;
  timezone: string;
  status: "active" | "suspended" | "deleted";
};

export function EditTenantForm({ tenant }: { tenant: EditTenantInitial }) {
  const [state, action, pending] = useActionState<UpdateTenantState, FormData>(
    updateTenantAction,
    {},
  );

  useEffect(() => {
    if (state?.ok) toast.success("Tenant mis à jour");
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  const countryDefault = COUNTRIES.some((c) => c.code === tenant.country)
    ? tenant.country
    : "FR";
  const currencyDefault = CURRENCIES.includes(tenant.defaultCurrency)
    ? tenant.defaultCurrency
    : "EUR";
  const timezoneDefault = (SUPPORTED_TIMEZONES as readonly string[]).includes(
    tenant.timezone,
  )
    ? tenant.timezone
    : "Europe/Paris";

  return (
    <form action={action} className="space-y-5 max-w-xl">
      <input type="hidden" name="tenantId" value={tenant.id} />

      {tenant.status === "suspended" ? (
        <Alert>
          <AlertDescription>
            Ce tenant est actuellement suspendu. Les modifications restent
            possibles mais ne le réactivent pas.
          </AlertDescription>
        </Alert>
      ) : null}

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label>Sous-domaine</Label>
        <Input value={tenant.subdomain} readOnly disabled />
        <p className="text-xs text-muted-foreground">
          Le sous-domaine est définitif et ne peut pas être modifié depuis cette
          interface.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          Nom de l&apos;entreprise <span className="text-destructive">*</span>
        </Label>
        <Input id="name" name="name" defaultValue={tenant.name} required />
        {state?.errors?.name?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminEmail">
          Email de l&apos;administrateur entreprise{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="adminEmail"
          name="adminEmail"
          type="email"
          defaultValue={tenant.adminEmail}
          required
        />
        <p className="text-xs text-muted-foreground">
          Modifier cette adresse transfère le rôle d&apos;administrateur principal
          au nouveau compte (l&apos;ancien est conservé).
        </p>
        {state?.errors?.adminEmail?.[0] ? (
          <p className="text-xs text-destructive">
            {state.errors.adminEmail[0]}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <select
            id="country"
            name="country"
            defaultValue={countryDefault}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {state?.errors?.country?.[0] ? (
            <p className="text-xs text-destructive">{state.errors.country[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultCurrency">Devise par défaut</Label>
          <select
            id="defaultCurrency"
            name="defaultCurrency"
            defaultValue={currencyDefault}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Appliqué aux nouveaux colis. Les colis existants conservent leur
            devise.
          </p>
          {state?.errors?.defaultCurrency?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.defaultCurrency[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Fuseau horaire</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={timezoneDefault}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          {SUPPORTED_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        {state?.errors?.timezone?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.timezone[0]}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/admin/tenants/${tenant.id}`}>Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
