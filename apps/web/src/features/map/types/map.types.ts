import type { RegulationFeature, RegulationFeatureCollection } from "@/features/regulations/types/regulation.types";

export type MapStatus = "idle" | "loading" | "ready" | "error";
export type SelectedRegulations = RegulationFeature[];
export type RegulationGeoJson = RegulationFeatureCollection;

