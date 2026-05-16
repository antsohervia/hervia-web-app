import { getTranslations } from "next-intl/server";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { listTenantMembers } from "@/lib/tenants/members-repo";
import { InviteForm } from "./_components/invite-form";
import { MembersTable } from "./_components/members-table";
import { PendingInvitationsTable } from "./_components/pending-invitations-table";

export const dynamic = "force-dynamic";

export default async function TenantUsersPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);
  const t = await getTranslations("users");

  const members = await listTenantMembers(session.tenant.id, session.userId);
  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending");
  const canEdit =
    session.role === "entreprise_admin" && !session.impersonating;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length > 1
              ? t("subtitlePlural", { count: members.length })
              : t("subtitle", { count: members.length })}
          </p>
        </div>
        {canEdit ? <InviteForm subdomain={subdomain} /> : null}
      </div>

      <MembersTable members={active} subdomain={subdomain} canEdit={canEdit} />

      <PendingInvitationsTable
        members={pending}
        subdomain={subdomain}
        canEdit={canEdit}
      />
    </div>
  );
}
