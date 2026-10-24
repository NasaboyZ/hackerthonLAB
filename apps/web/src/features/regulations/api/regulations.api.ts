import { apiFetch } from "@/lib/api/client";
import type { RegulationFeatureCollection, RegulationSummary } from "@/features/regulations/types/regulation.types";

export async function getRegulations(signal?: AbortSignal): Promise<RegulationSummary[]> {
  return apiFetch<RegulationSummary[]>("/api/v1/regulations", { signal, cache: "no-store" });
}

export async function getRegulationsGeoJson(bbox: string, signal?: AbortSignal): Promise<RegulationFeatureCollection> {
  return apiFetch<RegulationFeatureCollection>(`/api/v1/regulations/geojson?bbox=${encodeURIComponent(bbox)}`, { signal, cache: "no-store" });
}
