"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TenantsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) params.delete(k);
      else params.set(k, v);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 mb-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-q" className="text-xs">
          Recherche
        </Label>
        <Input
          id="filter-q"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Nom ou sous-domaine"
          className="w-64"
          onChange={(e) => update({ q: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-status" className="text-xs">
          Statut
        </Label>
        <select
          id="filter-status"
          defaultValue={sp.get("status") ?? "all"}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          onChange={(e) => update({ status: e.target.value })}
        >
          <option value="all">Tous</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-from" className="text-xs">
          Créé après
        </Label>
        <Input
          id="filter-from"
          type="date"
          defaultValue={sp.get("from") ?? ""}
          onChange={(e) => update({ from: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-to" className="text-xs">
          Créé avant
        </Label>
        <Input
          id="filter-to"
          type="date"
          defaultValue={sp.get("to") ?? ""}
          onChange={(e) => update({ to: e.target.value })}
        />
      </div>
    </div>
  );
}
