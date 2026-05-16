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
import type { TenantMemberAccount } from "@/lib/tenants/members-repo";
import { ResendInvitationDialog } from "./resend-invitation-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

export function PendingInvitationsTable({
  members,
  subdomain,
  canEdit,
}: {
  members: TenantMemberAccount[];
  subdomain: string;
  canEdit: boolean;
}) {
  const t = useTranslations("users");
  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "short" });

  if (members.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t("invitations.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("invitations.subtitle")}
        </p>
      </div>

      <ul className="md:hidden space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium break-all">{m.email}</p>
                <p className="text-xs text-muted-foreground">
                  {t("table.invitedAt")} :{" "}
                  {dateFmt.format(new Date(m.invitedAt))}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {t(`roles.${m.role}`)}
              </Badge>
            </div>
            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <ResendInvitationDialog
                  subdomain={subdomain}
                  memberId={m.id}
                  email={m.email}
                />
                <RemoveMemberDialog
                  subdomain={subdomain}
                  memberId={m.id}
                  email={m.email}
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
              <TableHead>{t("table.email")}</TableHead>
              <TableHead>{t("table.role")}</TableHead>
              <TableHead>{t("table.invitedAt")}</TableHead>
              {canEdit ? (
                <TableHead className="text-right">
                  {t("table.actions")}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`roles.${m.role}`)}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {dateFmt.format(new Date(m.invitedAt))}
                </TableCell>
                {canEdit ? (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ResendInvitationDialog
                        subdomain={subdomain}
                        memberId={m.id}
                        email={m.email}
                      />
                      <RemoveMemberDialog
                        subdomain={subdomain}
                        memberId={m.id}
                        email={m.email}
                      />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
