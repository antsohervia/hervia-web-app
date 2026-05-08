"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createTenantAction } from "../_actions";
import type { CreateTenantState } from "@/lib/validations/tenant";

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

export function CreateTenantForm() {
  const [state, action, pending] = useActionState<
    CreateTenantState,
    FormData
  >(createTenantAction, {});

  useEffect(() => {
    if (state?.errors?._form?.[0]) {
      toast.error(state.errors._form[0]);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-5 max-w-xl">
      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <Field
        name="name"
        label="Nom de l'entreprise"
        required
        errors={state?.errors?.name}
      />

      <Field
        name="subdomain"
        label="Sous-domaine"
        required
        autoCapitalize="off"
        errors={state?.errors?.subdomain}
        helper="Lettres minuscules, chiffres et tirets uniquement. Définitif après création."
        suggestions={state?.suggestions}
      />

      <Field
        name="adminEmail"
        type="email"
        label="Email de l'administrateur entreprise"
        required
        errors={state?.errors?.adminEmail}
        helper="Un email d'invitation (lien valable 72h) sera envoyé à cette adresse."
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <select
            id="country"
            name="country"
            defaultValue="FR"
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
            defaultValue="EUR"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {state?.errors?.defaultCurrency?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.defaultCurrency[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer le tenant"}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/tenants">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  helper,
  errors,
  suggestions,
  autoCapitalize,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  helper?: string;
  errors?: string[];
  suggestions?: string[];
  autoCapitalize?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        autoCapitalize={autoCapitalize}
      />
      {helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
      {errors?.[0] ? (
        <p className="text-xs text-destructive">{errors[0]}</p>
      ) : null}
      {suggestions && suggestions.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Suggestions :{" "}
          {suggestions.map((s, i) => (
            <span key={s}>
              <code className="rounded bg-muted px-1 py-0.5">{s}</code>
              {i < suggestions.length - 1 ? ", " : null}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
