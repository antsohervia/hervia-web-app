"use client";

import { useState, useTransition } from "react";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PARCEL_STATUS_TYPE_LABELS } from "@/lib/validations/parcel-status";
import type { ParcelStatus } from "@/lib/parcels/repo";
import { StatusForm } from "./_status-form";
import {
  deleteStatusAction,
  reorderStatusesAction,
} from "./_actions";

const MIN_STATUSES = 2;

export function StatusesManager({
  subdomain,
  initialStatuses,
}: {
  subdomain: string;
  initialStatuses: ParcelStatus[];
}) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [editing, setEditing] = useState<ParcelStatus | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  function move(index: number, dir: -1 | 1) {
    const next = [...statuses];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setStatuses(next);
    persistOrder(next);
  }

  function persistOrder(next: ParcelStatus[]) {
    const fd = new FormData();
    fd.set("subdomain", subdomain);
    fd.set("order", next.map((s) => s.id).join(","));
    startTransition(async () => {
      try {
        await reorderStatusesAction(fd);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de tri");
      }
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("subdomain", subdomain);
    fd.set("id", id);
    startTransition(async () => {
      try {
        await deleteStatusAction(fd);
        setStatuses((s) => s.filter((x) => x.id !== id));
        toast.success("Statut supprimé");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Suppression impossible");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {statuses.length} statut{statuses.length > 1 ? "s" : ""} ·
          glissez-déposez ou utilisez les flèches pour réordonner.
        </p>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-1" />
              Ajouter un statut
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau statut</DialogTitle>
            </DialogHeader>
            <StatusForm
              subdomain={subdomain}
              mode="create"
              onDone={() => {
                setCreating(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card divide-y">
        {statuses.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Aucun statut. Créez-en un pour démarrer.
          </p>
        ) : null}
        {statuses.map((s, i) => (
          <div
            key={s.id}
            className="p-3 flex items-center gap-3"
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || pending}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                aria-label="Monter"
              >
                ▲
              </button>
              <GripVertical className="size-4 text-muted-foreground my-0.5" />
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === statuses.length - 1 || pending}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                aria-label="Descendre"
              >
                ▼
              </button>
            </div>

            <span
              className="size-6 rounded-full border shrink-0"
              style={{ background: s.color }}
              aria-hidden
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{s.label}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground rounded bg-muted px-1.5 py-0.5">
                  {PARCEL_STATUS_TYPE_LABELS[s.type]}
                </span>
                <code className="text-xs text-muted-foreground">{s.code}</code>
              </div>
              {s.description ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {s.description}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.usage_count} colis associé{s.usage_count > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Dialog
                open={editing?.id === s.id}
                onOpenChange={(o) => setEditing(o ? s : null)}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Pencil className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifier le statut</DialogTitle>
                  </DialogHeader>
                  {editing?.id === s.id ? (
                    <StatusForm
                      subdomain={subdomain}
                      mode="edit"
                      status={editing}
                      onDone={() => setEditing(null)}
                    />
                  ) : null}
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      statuses.length <= MIN_STATUSES || s.usage_count > 0
                    }
                    title={
                      statuses.length <= MIN_STATUSES
                        ? "Au moins 2 statuts doivent rester actifs"
                        : s.usage_count > 0
                          ? `Utilisé par ${s.usage_count} colis`
                          : "Supprimer"
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce statut ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(s.id)}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
