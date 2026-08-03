"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useDeliveryRealtime(runId: string, onChange: () => void) {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      clearTimeout(timeout);
      timeout = setTimeout(onChange, 180);
    };

    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch (error) {
      console.error("Realtime client is not configured", error);
      return;
    }

    const channel = supabase
      .channel(`delivery-run-${runId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
          filter: `run_id=eq.${runId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "route_stops",
          filter: `run_id=eq.${runId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_runs",
          filter: `id=eq.${runId}`,
        },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [onChange, runId]);
}
