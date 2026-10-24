import { clientEnv } from "@/lib/config/env";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const endpoint = clientEnv.apiUrl ? `${clientEnv.apiUrl}${path}` : `/api/backend${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(endpoint, {
    ...init,
    credentials: "include",
    headers,
  });
  if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

let csrfToken: string | null = null;

export async function apiFetchWithCsrf<T>(path: string, init?: RequestInit): Promise<T> {
  if (!csrfToken) {
    const response = await apiFetch<{ token: string }>("/api/v1/auth/csrf");
    csrfToken = response.token;
  }
  const headers = new Headers(init?.headers);
  headers.set("X-CSRF-TOKEN", csrfToken);
  try {
    return await apiFetch<T>(path, { ...init, headers });
  } catch (error) {
    if (error instanceof Error && error.message.includes("400")) csrfToken = null;
    throw error;
  }
}

export function clearApiSession() { csrfToken = null; }

