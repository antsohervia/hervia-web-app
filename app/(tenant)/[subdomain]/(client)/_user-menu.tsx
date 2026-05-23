"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  clientLogoutAction,
  type ClientLogoutState,
} from "../(client-auth)/login/_actions";

type Props = {
  fullName: string;
  email: string | null;
  initials: string;
  brandPrimary: string;
  brandPrimaryForeground: string;
  brandBorder: string;
};

export function ClientUserMenu({
  fullName,
  email,
  initials,
  brandPrimary,
  brandPrimaryForeground,
  brandBorder,
}: Props) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menu utilisateur — ${fullName}`}
          className="inline-flex items-center gap-1.5 rounded-full p-1 pr-2 sm:pr-1 hover:bg-accent min-h-11 sm:min-h-0"
        >
          <span
            className="size-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              background: brandPrimary,
              color: brandPrimaryForeground,
            }}
          >
            {initials || "·"}
          </span>
          <ChevronDown
            className="size-3.5 text-muted-foreground hidden sm:block"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64"
        style={{ borderColor: brandBorder }}
      >
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold truncate">{fullName}</p>
          {email ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {email}
            </p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/reglages" className="cursor-pointer">
            <Settings className="size-4" />
            Réglages
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={action}>
          <DropdownMenuItem asChild>
            <button
              type="submit"
              disabled={pending}
              className="w-full cursor-pointer disabled:opacity-50"
            >
              <LogOut className="size-4" />
              Se déconnecter
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
