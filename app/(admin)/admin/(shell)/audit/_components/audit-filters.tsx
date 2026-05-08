"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TenantOption = { id: string; subdomain: string };

export function AuditFilters({
  actions,
  tenants,
}: {
  actions: string[];
  tenants: TenantOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [action, setAction] = useState(searchParams.get("action") ?? "");
  const [tenantId, setTenantId] = useState(searchParams.get("tenantId") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setQ(searchParams.get("q") ?? "");
    setAction(searchParams.get("action") ?? "");
    setTenantId(searchParams.get("tenantId") ?? "");
    setFrom(searchParams.get("from") ?? "");
    setTo(searchParams.get("to") ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  function apply() {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (action) sp.set("action", action);
    if (tenantId) sp.set("tenantId", tenantId);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    startTransition(() => {
      router.replace(`/admin/audit${sp.size ? `?${sp}` : ""}`);
    });
  }

  function reset() {
    setQ("");
    setAction("");
    setTenantId("");
    setFrom("");
    setTo("");
    startTransition(() => {
      router.replace("/admin/audit");
    });
  }

  function exportFile(format: "csv" | "json") {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("format", format);
    window.location.href = `/admin/audit/export?${sp.toString()}`;
  }

  return (
    <div className="rounded-lg border bg-card p-4 mb-4 space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="q" className="text-xs">
            Recherche
          </Label>
          <Input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="action ou email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="action" className="text-xs">
            Action
          </Label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            <option value="">Toutes</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenantId" className="text-xs">
            Tenant
          </Label>
          <select
            id="tenantId"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            <option value="">Tous</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.subdomain}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from" className="text-xs">
            Du
          </Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to" className="text-xs">
            Au
          </Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={apply} disabled={isPending} size="sm">
          Filtrer
        </Button>
        <Button onClick={reset} variant="ghost" size="sm" disabled={isPending}>
          Réinitialiser
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => exportFile("csv")}
            variant="outline"
            size="sm"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => exportFile("json")}
            variant="outline"
            size="sm"
          >
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
