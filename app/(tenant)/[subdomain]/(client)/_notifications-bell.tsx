"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Bell, Check, Loader2, PackageCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  listClientNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ClientNotification,
} from "./_notifications-actions";

type Props = {
  subdomain: string;
  clientId: string;
  brandPrimary: string;
  brandBorder: string;
  brandMuted: string;
  initialItems: ClientNotification[];
  initialUnreadCount: number;
  initialHasMore: boolean;
};

const dtfRelative = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return dtfRelative.format(d);
}

export function NotificationsBell({
  subdomain,
  clientId,
  brandPrimary,
  brandBorder,
  brandMuted,
  initialItems,
  initialUnreadCount,
  initialHasMore,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ClientNotification[]>(initialItems);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, startTransition] = useTransition();
  const seenIds = useRef<Set<string>>(new Set(initialItems.map((n) => n.id)));

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`notif:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_client_id=eq.${clientId}`,
        },
        (payload) => {
          const row = payload.new as ClientNotification;
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);
          setItems((prev) => [row, ...prev].slice(0, 200));
          if (!row.read_at) setUnread((c) => c + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_client_id=eq.${clientId}`,
        },
        (payload) => {
          const row = payload.new as ClientNotification;
          setItems((prev) =>
            prev.map((n) => (n.id === row.id ? { ...n, ...row } : n)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const handleItemClick = useCallback(
    (n: ClientNotification) => {
      if (!n.read_at) {
        const now = new Date().toISOString();
        setItems((prev) =>
          prev.map((it) => (it.id === n.id ? { ...it, read_at: now } : it)),
        );
        setUnread((c) => Math.max(0, c - 1));
        startTransition(() => {
          markNotificationRead(subdomain, n.id).catch(() => {});
        });
      }
      if (n.link_url) {
        setOpen(false);
        window.location.href = n.link_url;
      }
    },
    [subdomain],
  );

  const handleMarkAll = useCallback(() => {
    if (unread === 0) return;
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: now })),
    );
    setUnread(0);
    startTransition(() => {
      markAllNotificationsRead(subdomain).catch(() => {});
    });
  }, [subdomain, unread]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || items.length === 0) return;
    setLoadingMore(true);
    try {
      const cursor = items[items.length - 1]?.created_at;
      const res = await listClientNotifications(subdomain, cursor);
      const fresh = res.items.filter((n) => !seenIds.current.has(n.id));
      fresh.forEach((n) => seenIds.current.add(n.id));
      setItems((prev) => [...prev, ...fresh]);
      setHasMore(res.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, items, loadingMore, subdomain]);

  const badgeLabel = unread > 99 ? "99+" : String(unread);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unread > 0
              ? `Notifications (${unread} non lue${unread > 1 ? "s" : ""})`
              : "Notifications"
          }
          className="relative inline-flex items-center justify-center size-11 sm:size-10 rounded-md hover:bg-accent text-foreground"
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-sm"
              style={{ background: brandPrimary }}
            >
              {badgeLabel}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm p-0 max-h-[80vh] flex flex-col"
        style={{ borderColor: brandBorder }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: brandBorder }}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 ? (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: brandPrimary }}
              >
                {badgeLabel}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unread === 0}
            className="text-xs font-medium inline-flex items-center gap-1 hover:underline disabled:opacity-40 disabled:no-underline"
            style={{ color: brandPrimary }}
          >
            <Check className="size-3.5" />
            Tout marquer lu
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div
              className="px-6 py-10 text-center"
              style={{ color: brandMuted }}
            >
              <PackageCheck className="mx-auto size-8 mb-2 opacity-60" />
              <p className="text-sm">Aucune notification pour le moment.</p>
              <p className="text-xs mt-1">
                Vous serez alerté ici à chaque mise à jour de vos colis.
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: brandBorder }}>
              {items.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-accent flex gap-3 items-start min-h-[44px]",
                        isUnread && "bg-accent/40",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-2 rounded-full shrink-0",
                          isUnread ? "" : "opacity-0",
                        )}
                        style={{ background: brandPrimary }}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            isUnread ? "font-semibold" : "font-medium",
                          )}
                        >
                          {n.title}
                        </p>
                        {n.body ? (
                          <p
                            className="text-xs mt-0.5 line-clamp-2"
                            style={{ color: brandMuted }}
                          >
                            {n.body}
                          </p>
                        ) : null}
                        <p
                          className="text-[11px] mt-1"
                          style={{ color: brandMuted }}
                        >
                          {formatWhen(n.created_at)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore ? (
            <div className="p-3 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-xs font-medium inline-flex items-center gap-1.5 hover:underline disabled:opacity-50"
                style={{ color: brandPrimary }}
              >
                {loadingMore ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Charger plus
              </button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
