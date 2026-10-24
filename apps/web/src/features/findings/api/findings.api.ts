import { apiFetch, apiFetchWithCsrf } from "@/lib/api/client";
import type { Finding, FindingInput } from "@/features/findings/types/finding.types";

export function getFindings(signal?: AbortSignal) { return apiFetch<Finding[]>("/api/v1/findings", { signal }); }
export function createFinding(input: FindingInput) { return apiFetchWithCsrf<Finding>("/api/v1/findings", { method: "POST", body: JSON.stringify(input) }); }
export function updateFinding(id: string, input: FindingInput) { return apiFetchWithCsrf<Finding>(`/api/v1/findings/${id}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function deleteFinding(id: string) { return apiFetchWithCsrf<void>(`/api/v1/findings/${id}`, { method: "DELETE" }); }
