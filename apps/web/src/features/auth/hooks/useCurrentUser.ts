"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "@/features/auth/api/auth.api";
import type { CurrentUser } from "@/features/auth/types/auth.types";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setUser(await getCurrentUser()); } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    void getCurrentUser().then(value => { if (active) setUser(value); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const handleAuthChange = () => { void refresh(); };
    window.addEventListener("magnetrail-auth-changed", handleAuthChange);
    return () => window.removeEventListener("magnetrail-auth-changed", handleAuthChange);
  }, [refresh]);
  return { user, loading, refresh, setUser };
}
