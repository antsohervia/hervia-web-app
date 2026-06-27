"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientListRow } from "@/lib/clients/repo";
import { RecoveryLinkDialog } from "./recovery-link-dialog";

const STATUS_VARIANT: Record<
  ClientListRow["status"],
  "default" | "outline" | "destructive"
> = {
  active: "default",
  pending_activation: "outline",
  disabled: "destructive",
};

export function ClientsTable({
  clients,
  subdomain,
  canEdit,
}: {
  clients: ClientListRow[];
  subdomain: string;
  canEdit: boolean;
}) {
  const t = useTranslations("clients");
  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "short" });

  if (clients.length === 0) {
    return null;
  }

  return (
    <>
      <ul className="md:hidden space-y-2">
        {clients.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium truncate">{c.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.email ?? "—"}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("columns.parcels")}: {c.parcel_count} ·{" "}
                  {dateFmt.format(new Date(c.created_at))}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[c.status]} className="shrink-0">
                {t(`status.${c.status}`)}
              </Badge>
            </div>
            {canEdit && c.user_id && c.email ? (
              <div className="flex flex-wrap gap-2">
                <RecoveryLinkDialog
                  subdomain={subdomain}
                  clientId={c.id}
                  clientEmail={c.email}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="hidden md:block rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.email")}</TableHead>
              <TableHead>{t("columns.phone")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="text-center">
                {t("columns.parcels")}
              </TableHead>
              <TableHead>{t("columns.createdAt")}</TableHead>
              {canEdit ? (
                <TableHead className="text-right">
                  {t("columns.actions")}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status]}>
                    {t(`status.${c.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{c.parcel_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {dateFmt.format(new Date(c.created_at))}
                </TableCell>
                {canEdit ? (
                  <TableCell className="text-right">
                    {c.user_id && c.email ? (
                      <RecoveryLinkDialog
                        subdomain={subdomain}
                        clientId={c.id}
                        clientEmail={c.email}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
