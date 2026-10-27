"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Whether the signed-in couple has connected a phone to their planner. The
 * webhook saves text_phone on their first text, so while `watch` is on this
 * checks every few seconds and flips to connected the moment that text arrives.
 */
export function useTextConnection({ watch = false }: { watch?: boolean } = {}) {
  const supabase = useMemo(() => createClient(), []);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("text_phone")
        .eq("id", user.id)
        .single();
      if (!cancelled) setConnected(!!data?.text_phone);
    }

    check();
    const timer = watch && !connected ? setInterval(check, 4000) : undefined;
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [supabase, watch, connected]);

  return { connected, loading: connected === null };
}
