"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from "@/lib/auth/roles";
import type { CreateAdminState } from "@/lib/validations/admin";
import { createAdminAction } from "../_actions";

export function CreateAdminForm() {
  const [state, action, pending] = useActionState<CreateAdminState, FormData>(
    createAdminAction,
    {},
  );

  useEffect(() => {
    if (state?.ok) toast.success("Invitation envoyée");
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  return (
    <form action={action} className="space-y-5 max-w-xl">
      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input id="email" name="email" type="email" required />
        {state?.errors?.email?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.email[0]}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Un email d&apos;invitation lui permettra de définir son mot de passe.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">
          Rôle <span className="text-destructive">*</span>
        </Label>
        <select
          id="role"
          name="role"
          defaultValue="admin_support"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {ADMIN_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        {state?.errors?.role?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.role[0]}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi..." : "Inviter l'admin"}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/admins">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
