import { Button } from "@/components/ui/button";
import { reactivateTenantAction } from "../_actions";

export function ReactivateButton({ tenantId }: { tenantId: string }) {
  return (
    <form action={reactivateTenantAction}>
      <input type="hidden" name="tenantId" value={tenantId} />
      <Button type="submit" variant="outline">
        Réactiver
      </Button>
    </form>
  );
}
