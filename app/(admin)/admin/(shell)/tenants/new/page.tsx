import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTenantForm } from "../_components/create-tenant-form";

export default function NewTenantPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/tenants">
          <ArrowLeft className="size-4 mr-1" />
          Retour
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold mb-1">Nouveau tenant</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Créer un espace transitaire avec son sous-domaine dédié.
      </p>
      <CreateTenantForm />
    </div>
  );
}
