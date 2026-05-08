import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endImpersonationAction } from "@/app/(admin)/admin/(shell)/tenants/_actions";

export function ImpersonationBanner({ tenantName }: { tenantName: string }) {
  return (
    <div
      role="alert"
      className="sticky top-0 z-50 bg-amber-500 text-amber-950 border-b border-amber-700"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 text-sm">
        <span className="flex items-center gap-2">
          <Eye className="size-4" />
          Mode impersonification — espace <strong>{tenantName}</strong> en lecture seule
        </span>
        <form action={endImpersonationAction}>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="bg-white/80 hover:bg-white border-amber-700"
          >
            {"Quitter l'impersonification"}
          </Button>
        </form>
      </div>
    </div>
  );
}
