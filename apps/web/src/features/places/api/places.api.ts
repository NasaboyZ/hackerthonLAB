import { apiFetch, apiFetchWithCsrf } from "@/lib/api/client";
import type { CreateAreaInput, CreateSpotInput, Place } from "@/features/places/types/place.types";

export function getPlaces(signal?: AbortSignal) {
  return apiFetch<Place[]>("/api/v1/places", { signal });
}

export function createSpot(input: CreateSpotInput) {
  return apiFetchWithCsrf<Place>("/api/v1/places/spots", { method: "POST", body: JSON.stringify(input) });
}

export function createArea(input: CreateAreaInput) {
  return apiFetchWithCsrf<Place>("/api/v1/places/areas", { method: "POST", body: JSON.stringify(input) });
}

export function deletePlace(id: string) {
  return apiFetchWithCsrf<void>(`/api/v1/places/${id}`, { method: "DELETE" });
}
