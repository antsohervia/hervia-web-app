"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import type { TransportMode } from "@/lib/transport-modes/repo";
import { TransportModeForm } from "./_mode-form";
import {
  deleteTransportModeAction,
  reorderTransportModesAction,
} from "./_actions";

export function TransportModesManager({
  subdomain,
  initialModes,
}: {
  subdomain: string;
  initialModes: TransportMode[];
}) {
  const [modes, setModes] = useState(initialModes);
  const [editing, setEditing] = useState<TransportMode | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  function move(index: number, dir: -1 | 1) {
    const next = [...modes];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setModes(next);
    persistOrder(next);
  }

  function persistOrder(next: TransportMode[]) {
    const fd = new FormData();
    fd.set("subdomain", subdomain);
    fd.set("order", next.map((m) => m.id).join(","));
    startTransition(async () => {
      try {
        await reorderTransportModesAction(fd);
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
        await deleteTransportModeAction(fd);
        setModes((s) => s.filter((x) => x.id !== id));
        toast.success("Mode supprimé");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Suppression impossible");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {modes.length} mode{modes.length > 1 ? "s" : ""} · utilisez les
          flèches pour réordonner.
        </p>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto min-h-11">
              <Plus className="size-4 mr-1" />
              Ajouter un mode
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau mode de transport</DialogTitle>
            </DialogHeader>
            <TransportModeForm
              subdomain={subdomain}
              mode="create"
              onDone={() => setCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card divide-y">
        {modes.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Aucun mode. Ajoutez-en un pour permettre aux clients de saisir un
            colis.
          </p>
        ) : null}
        {modes.map((m, i) => (
          <div key={m.id} className="p-3 flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || pending}
                className="size-8 sm:size-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-sm"
                aria-label="Monter"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === modes.length - 1 || pending}
                className="size-8 sm:size-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-sm"
                aria-label="Descendre"
              >
                ▼
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium">{m.label}</span>
                <code className="text-xs text-muted-foreground break-all">{m.code}</code>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {m.usage_count} colis associé{m.usage_count > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Dialog
                open={editing?.id === m.id}
                onOpenChange={(o) => setEditing(o ? m : null)}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Modifier"
                    className="min-h-11 min-w-11"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifier le mode</DialogTitle>
                  </DialogHeader>
                  {editing?.id === m.id ? (
                    <TransportModeForm
                      subdomain={subdomain}
                      mode="edit"
                      record={editing}
                      onDone={() => setEditing(null)}
                    />
                  ) : null}
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer"
                    disabled={m.usage_count > 0}
                    title={
                      m.usage_count > 0
                        ? `Utilisé par ${m.usage_count} colis`
                        : "Supprimer"
                    }
                    className="min-h-11 min-w-11"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce mode ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(m.id)}>
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
