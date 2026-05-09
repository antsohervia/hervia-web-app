"use client";

import { useActionState, useEffect } from "react";
import { LogOut } from "lucide-react";
import {
  clientLogoutAction,
  type ClientLogoutState,
} from "../(client-auth)/login/_actions";

export function ClientLogoutButton() {
  const [state, action, pending] = useActionState<ClientLogoutState, FormData>(
    clientLogoutAction,
    {},
  );

  useEffect(() => {
    if (state?.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state?.redirectTo]);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent text-muted-foreground disabled:opacity-50"
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Se déconnecter</span>
      </button>
    </form>
  );
}
