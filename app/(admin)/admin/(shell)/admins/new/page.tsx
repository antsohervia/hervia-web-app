import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { CreateAdminForm } from "../_components/create-admin-form";

export const dynamic = "force-dynamic";

export default async function NewAdminPage() {
  await requireSuperAdmin();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/admins">
          <ArrowLeft className="size-4 mr-1" />
          Retour
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold mb-1">Nouvel administrateur</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Le compte sera créé en lui envoyant une invitation par email.
      </p>
      <CreateAdminForm />
    </div>
  );
}
