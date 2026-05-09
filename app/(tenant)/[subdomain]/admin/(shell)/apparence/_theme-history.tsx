"use client";

import { History, RotateCcw } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TENANT_THEME_LABELS } from "@/lib/validations/branding";
import type { ThemeHistoryEntry } from "@/lib/branding/repo";
import { restoreThemeAction } from "./_actions";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ThemeHistory({
  subdomain,
  history,
}: {
  subdomain: string;
  history: ThemeHistoryEntry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" />
          Historique des publications
        </CardTitle>
        <CardDescription>
          Les 5 dernières publications de thème.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune publication encore enregistrée.
          </p>
        ) : (
          <ul className="divide-y">
            {history.map((h) => (
              <li
                key={h.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="size-6 rounded-full border"
                    style={{ background: h.primary_color }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {TENANT_THEME_LABELS[h.theme]}
                      <span className="text-muted-foreground font-normal">
                        {" · "}
                        {h.primary_color}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dateFmt.format(new Date(h.published_at))}
                      {h.published_by_email ? ` · ${h.published_by_email}` : ""}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <RotateCcw className="size-4 mr-1" />
                      Rétablir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rétablir ce thème</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ce changement sera visible immédiatement par tous vos
                        clients.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <form action={restoreThemeAction}>
                          <input
                            type="hidden"
                            name="subdomain"
                            value={subdomain}
                          />
                          <input
                            type="hidden"
                            name="historyId"
                            value={h.id}
                          />
                          <button type="submit">Rétablir</button>
                        </form>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
