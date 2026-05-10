"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("statuses");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [editing, setEditing] = useState<ParcelStatus | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setStatuses(initialStatuses);
  }, [initialStatuses]);

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
        toast.error(e instanceof Error ? e.message : t("sortError"));
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
        toast.success(t("deleted"));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("deleteError"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {statuses.length > 1
            ? t("sortHintPlural", { count: statuses.length })
            : t("sortHint", { count: statuses.length })}
        </p>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="size-4 mr-1" />
              {t("add")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createTitle")}</DialogTitle>
            </DialogHeader>
            <StatusForm
              subdomain={subdomain}
              mode="create"
              onDone={() => {
                setCreating(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card divide-y">
        {statuses.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{t("noData")}</p>
        ) : null}
        {statuses.map((s, i) => (
          <div
            key={s.id}
            className="p-3 flex items-center gap-2 sm:gap-3"
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || pending}
                className="size-8 sm:size-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-sm"
                aria-label={t("moveUp")}
              >
                ▲
              </button>
              <GripVertical
                className="size-4 text-muted-foreground mx-auto my-0.5 hidden sm:block"
                aria-hidden
              />
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === statuses.length - 1 || pending}
                className="size-8 sm:size-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-sm"
                aria-label={t("moveDown")}
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
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium">{s.label}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground rounded bg-muted px-1.5 py-0.5">
                  {PARCEL_STATUS_TYPE_LABELS[s.type]}
                </span>
                <code className="text-xs text-muted-foreground break-all">{s.code}</code>
                {s.system_code ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground rounded bg-muted px-1.5 py-0.5"
                    title={t("systemNotDeletable")}
                  >
                    <Lock className="size-3" aria-hidden />
                    {t("systemBadge")}
                  </span>
                ) : null}
              </div>
              {s.description ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {s.description}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.usage_count > 1
                  ? t("parcelsLinkedPlural", { count: s.usage_count })
                  : t("parcelsLinked", { count: s.usage_count })}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Dialog
                open={editing?.id === s.id}
                onOpenChange={(o) => setEditing(o ? s : null)}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={tCommon("edit")} className="min-h-11 min-w-11">
                    <Pencil className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("editTitle")}</DialogTitle>
                  </DialogHeader>
                  {editing?.id === s.id ? (
                    <StatusForm
                      subdomain={subdomain}
                      mode="edit"
                      status={editing}
                      onDone={() => {
                        setEditing(null);
                        router.refresh();
                      }}
                    />
                  ) : null}
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tCommon("delete")}
                    disabled={
                      statuses.length <= MIN_STATUSES ||
                      s.usage_count > 0 ||
                      s.system_code != null
                    }
                    title={
                      s.system_code != null
                        ? t("systemNotDeletable")
                        : statuses.length <= MIN_STATUSES
                          ? t("minActiveTip")
                          : s.usage_count > 0
                            ? t("usedBy", { count: s.usage_count })
                            : tCommon("delete")
                    }
                    className="min-h-11 min-w-11"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(s.id)}>
                      {tCommon("delete")}
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
