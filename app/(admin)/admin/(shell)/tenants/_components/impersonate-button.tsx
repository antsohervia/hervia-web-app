import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { impersonateTenantAction } from "../_actions";

export function ImpersonateButton({
  tenantId,
  disabled,
}: {
  tenantId: string;
  disabled?: boolean;
}) {
  return (
    <form action={impersonateTenantAction}>
      <input type="hidden" name="tenantId" value={tenantId} />
      <Button type="submit" variant="outline" disabled={disabled}>
        <Eye className="size-4 mr-1" />
        {"Accéder à l'espace entreprise"}
      </Button>
    </form>
  );
}
