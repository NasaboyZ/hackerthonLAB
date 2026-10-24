import { apiFetch, apiFetchWithCsrf, clearApiSession } from "@/lib/api/client";
import type { CurrentUser, LoginInput, RegisterInput } from "@/features/auth/types/auth.types";

export function getCurrentUser(signal?: AbortSignal) { return apiFetch<CurrentUser>("/api/v1/auth/me", { signal }); }
export function register(input: RegisterInput) { return apiFetchWithCsrf<CurrentUser>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(input) }); }
export function login(input: LoginInput) { return apiFetchWithCsrf<CurrentUser>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) }); }
export async function logout() { await apiFetchWithCsrf<void>("/api/v1/auth/logout", { method: "POST" }); clearApiSession(); }
