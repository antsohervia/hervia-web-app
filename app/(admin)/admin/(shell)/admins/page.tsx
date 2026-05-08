import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { listAdmins } from "@/lib/admins/repo";
import { AdminsTable } from "./_components/admins-table";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await requireSuperAdmin();
  const admins = await listAdmins();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Administrateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {admins.length} compte{admins.length > 1 ? "s" : ""} au total.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/admins/new">
            <Plus className="size-4 mr-1" />
            Nouvel admin
          </Link>
        </Button>
      </div>

      <AdminsTable admins={admins} currentUserId={session.user.id} />
    </div>
  );
}
