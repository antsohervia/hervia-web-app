"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteTenantAction } from "../_actions";
import type { DeleteTenantState } from "@/lib/validations/tenant";

type Props = {
  tenantId: string;
  subdomain: string;
  status: "active" | "suspended" | "deleted";
};

export function DeleteDialog({ tenantId, subdomain, status }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [exportDownloaded, setExportDownloaded] = useState(false);
  const [state, action, pending] = useActionState<DeleteTenantState, FormData>(
    deleteTenantAction,
    {},
  );

  useEffect(() => {
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  const isDisabled = status !== "suspended";
  const matches = confirmInput.trim().toLowerCase() === subdomain.toLowerCase();

  async function handleDownload() {
    const link = document.createElement("a");
    link.href = `/admin/tenants/${tenantId}/export`;
    link.download = `tenant-${subdomain}-export.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setExportDownloaded(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={isDisabled}
          title={
            isDisabled
              ? "Le tenant doit être suspendu avant de pouvoir être supprimé"
              : undefined
          }
        >
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="tenantId" value={tenantId} />
          <DialogHeader>
            <DialogTitle>Suppression définitive</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le sous-domaine sera mis en
              quarantaine pour 30 jours.
            </DialogDescription>
          </DialogHeader>

          {state?.errors?._form?.[0] ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <p className="text-sm font-medium">
              {"1. Télécharger l'export"}
            </p>
            <p className="text-xs text-muted-foreground">
              {"ZIP contenant clients, colis, statuts et journaux d'audit (CSV + JSON)."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              {exportDownloaded ? "✓ Téléchargé" : "Télécharger l'export"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmedSubdomain">
              2. Saisir <code className="text-xs">{subdomain}</code> pour confirmer
            </Label>
            <Input
              id="confirmedSubdomain"
              name="confirmedSubdomain"
              autoCapitalize="off"
              autoComplete="off"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
            />
            {state?.errors?.confirmedSubdomain?.[0] ? (
              <p className="text-xs text-destructive">
                {state.errors.confirmedSubdomain[0]}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || !matches || !exportDownloaded}
            >
              {pending ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
