import { apiFetch, apiFetchWithCsrf } from "@/lib/api/client";
import type { CurrentUser } from "@/features/auth/types/auth.types";

export function getPlayerProfile(signal?: AbortSignal) { return apiFetch<CurrentUser>("/api/v1/players/me", { signal }); }
export function updateUsername(username: string) { return apiFetchWithCsrf<CurrentUser>("/api/v1/players/me", { method: "PATCH", body: JSON.stringify({ username }) }); }
