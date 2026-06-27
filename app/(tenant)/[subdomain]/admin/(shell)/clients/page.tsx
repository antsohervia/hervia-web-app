import { Contact } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { listClients } from "@/lib/clients/repo";
import { Button } from "@/components/ui/button";
import { CreateClientForm } from "./_components/create-client-form";
import { ClientsTable } from "./_components/clients-table";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function ClientsListPage({
  params,
  searchParams,
}: Props) {
  const { subdomain } = await params;
  const sp = await searchParams;
  const session = await requireTenantSession(subdomain);
  const t = await getTranslations("clients");
  const tCommon = await getTranslations("common");
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10)) : 1;

  const { rows, total } = await listClients(session.tenant.id, {
    search: sp.q,
    status: sp.status,
    page,
    pageSize: 25,
  });

  const canEdit =
    session.role === "entreprise_admin" && !session.impersonating;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total > 1
              ? t("subtitlePlural", { count: total })
              : t("subtitle", { count: total })}
          </p>
        </div>
        {canEdit ? <CreateClientForm subdomain={subdomain} /> : null}
      </div>

      <form className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-end gap-3">
        <div className="space-y-1 sm:w-64">
          <label className="text-xs text-muted-foreground">
            {t("search")}
          </label>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder={t("searchPlaceholder")}
            className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {t("statusFilter")}
          </label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="flex h-11 sm:h-9 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
          >
            <option value="">{tCommon("all")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="pending_activation">
              {t("status.pending_activation")}
            </option>
            <option value="disabled">{t("status.disabled")}</option>
          </select>
        </div>
        <Button type="submit" variant="outline" className="w-full sm:w-auto">
          {tCommon("filter")}
        </Button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-md border bg-card p-10 text-center">
          <Contact className="size-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t("noData")}</p>
        </div>
      ) : (
        <ClientsTable
          clients={rows}
          subdomain={subdomain}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
