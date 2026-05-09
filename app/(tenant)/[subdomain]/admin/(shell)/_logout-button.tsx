"use client";

import { useActionState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { logoutAction, type LogoutState } from "../login/_actions";

export function LogoutButton({ subdomain }: { subdomain: string }) {
  const [state, action, pending] = useActionState<LogoutState, FormData>(
    logoutAction,
    {},
  );

  useEffect(() => {
    if (state?.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state?.redirectTo]);

  return (
    <form action={action} className="p-2 border-t">
      <input type="hidden" name="subdomain" value={subdomain} />
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent text-muted-foreground disabled:opacity-50"
      >
        <LogOut className="size-4" />
        Déconnexion
      </button>
    </form>
  );
}
