import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/roles";
import type { AdminAccount } from "@/lib/admins/repo";
import { RoleSelectDialog } from "./role-select-dialog";
import { DisableAdminDialog } from "./disable-admin-dialog";

export function AdminsTable({
  admins,
  currentUserId,
}: {
  admins: AdminAccount[];
  currentUserId: string;
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((a) => {
            const isSelf = a.id === currentUserId;
            return (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.email}
                  {isSelf ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (vous)
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {ADMIN_ROLE_LABELS[a.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.lastSignInAt
                    ? new Date(a.lastSignInAt).toLocaleString("fr-FR")
                    : "—"}
                </TableCell>
                <TableCell>
                  {a.disabled ? (
                    <Badge
                      variant="outline"
                      className="bg-rose-50 text-rose-700 border-rose-200"
                    >
                      Désactivé
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      Actif
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isSelf ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <RoleSelectDialog
                        adminId={a.id}
                        email={a.email}
                        currentRole={a.role}
                      />
                      <DisableAdminDialog
                        adminId={a.id}
                        email={a.email}
                        disabled={a.disabled}
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {admins.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-sm text-muted-foreground py-8"
              >
                Aucun administrateur.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
