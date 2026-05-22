"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  parcelId: string;
};

export function RealtimeParcelRefresh({ parcelId }: Props) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let authSub: { unsubscribe: () => void } | null = null;

    const schedule = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => router.refresh(), 250);
    };

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      const { data } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s?.access_token) supabase.realtime.setAuth(s.access_token);
      });
      authSub = data.subscription;

      channel = supabase
        .channel(`parcel:${parcelId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "parcels",
            filter: `id=eq.${parcelId}`,
          },
          schedule,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "parcel_events",
            filter: `parcel_id=eq.${parcelId}`,
          },
          schedule,
        )
        .subscribe((status, err) => {
          if (status !== "SUBSCRIBED") {
            console.warn("[parcel realtime]", status, err);
          }
        });
    })();

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      authSub?.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [parcelId, router]);

  return null;
}
