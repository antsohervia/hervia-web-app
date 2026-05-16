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
import { RoleChangeDialog } from "./role-change-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

export function MembersTable({
  members,
  subdomain,
  canEdit,
}: {
  members: TenantMemberAccount[];
  subdomain: string;
  canEdit: boolean;
}) {
  const t = useTranslations("users");
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });

  if (members.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("table.noActive")}</p>
      </div>
    );
  }

  return (
    <>
      <ul className="md:hidden space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium break-all">
                  {m.email}
                  {m.isSelf ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t("table.you")})
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("table.lastSignIn")} :{" "}
                  {m.lastSignInAt
                    ? dateFmt.format(new Date(m.lastSignInAt))
                    : "—"}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {t(`roles.${m.role}`)}
              </Badge>
            </div>
            {canEdit && !m.isSelf ? (
              <div className="flex flex-wrap gap-2">
                <RoleChangeDialog
                  subdomain={subdomain}
                  memberId={m.id}
                  email={m.email}
                  currentRole={m.role}
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
              <TableHead>{t("table.lastSignIn")}</TableHead>
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
                <TableCell className="font-medium">
                  {m.email}
                  {m.isSelf ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t("table.you")})
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`roles.${m.role}`)}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.lastSignInAt
                    ? dateFmt.format(new Date(m.lastSignInAt))
                    : "—"}
                </TableCell>
                {canEdit ? (
                  <TableCell className="text-right">
                    {m.isSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <RoleChangeDialog
                          subdomain={subdomain}
                          memberId={m.id}
                          email={m.email}
                          currentRole={m.role}
                        />
                        <RemoveMemberDialog
                          subdomain={subdomain}
                          memberId={m.id}
                          email={m.email}
                        />
                      </div>
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
