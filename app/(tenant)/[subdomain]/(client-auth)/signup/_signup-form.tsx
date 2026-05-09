"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  clientSignupAction,
} from "./_actions";
import type { ClientSignupState } from "@/lib/validations/client-auth";

export function ClientSignupForm({
  subdomain,
  tenantName,
}: {
  subdomain: string;
  tenantName: string;
}) {
  const [state, action, pending] = useActionState<
    ClientSignupState,
    FormData
  >(clientSignupAction, {});

  if (state?.ok) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <Alert>
          <AlertDescription>
            Si cette adresse n&apos;est pas déjà inscrite, vous recevrez un
            email d&apos;activation dans quelques instants. Vérifiez votre
            boîte mail (et vos spams) pour finaliser la création de votre
            compte.
          </AlertDescription>
        </Alert>
        <Link
          href="/login"
          className="text-sm underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-lg border bg-card p-6 shadow-sm space-y-4"
    >
      <input type="hidden" name="subdomain" value={subdomain} />

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="fullName">
          Nom complet ou raison sociale{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Input id="fullName" name="fullName" type="text" required />
        {state?.errors?.fullName?.[0] ? (
          <p className="text-xs text-destructive">
            {state.errors.fullName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state?.errors?.email?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.email[0]}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">
            Mot de passe <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">
            8 caractères min. dont 1 chiffre et 1 lettre.
          </p>
          {state?.errors?.password?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.password[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">
            Confirmation <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          {state?.errors?.confirm?.[0] ? (
            <p className="text-xs text-destructive">
              {state.errors.confirm[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Vous êtes <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="importer"
              required
              defaultChecked
            />
            Importateur
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="exporter" />
            Exportateur
          </label>
        </div>
        {state?.errors?.role?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.role[0]}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+261 34 00 000 00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Société</Label>
          <Input id="company" name="company" type="text" />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="cgu" name="cgu" required />
        <Label htmlFor="cgu" className="text-sm font-normal leading-snug">
          J&apos;accepte les conditions générales d&apos;utilisation de{" "}
          {tenantName}.
        </Label>
      </div>
      {state?.errors?.cgu?.[0] ? (
        <p className="text-xs text-destructive">{state.errors.cgu[0]}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
