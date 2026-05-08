"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import type { AuditLogRow } from "@/lib/audit/repo";

export function AuditRow({ row }: { row: AuditLogRow }) {
  const [open, setOpen] = useState(false);
  const hasPayload =
    row.payload && Object.keys(row.payload as object).length > 0;

  return (
    <>
      <TableRow>
        <TableCell className="text-xs whitespace-nowrap">
          {new Date(row.created_at).toLocaleString("fr-FR")}
        </TableCell>
        <TableCell>
          <code className="text-xs">{row.action}</code>
        </TableCell>
        <TableCell className="text-sm">{row.actor_email ?? "—"}</TableCell>
        <TableCell className="text-sm">
          {row.tenant_subdomain ? (
            <Link
              href={`/admin/tenants/${row.tenant_id}`}
              className="hover:underline"
            >
              {row.tenant_subdomain}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          {hasPayload ? (
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {open ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              {open ? "Masquer" : "Détails"}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>
      {open && hasPayload ? (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30">
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(row.payload, null, 2)}
            </pre>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}
