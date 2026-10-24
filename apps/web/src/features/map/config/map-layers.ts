export type MapLayerDefinition = Readonly<{
  id: string;
  labelKey: string;
  category: "base" | "regulations" | "information" | "user";
  defaultVisible: boolean;
  implemented: boolean;
  mapLayerIds: readonly string[];
}>;

export const mapLayers: readonly MapLayerDefinition[] = [
  { id: "base-map", labelKey: "baseMap", category: "base", defaultVisible: true, implemented: false, mapLayerIds: [] },
  { id: "water-bodies", labelKey: "waterBodies", category: "base", defaultVisible: true, implemented: false, mapLayerIds: [] },
  { id: "verified-prohibitions", labelKey: "verifiedProhibitions", category: "regulations", defaultVisible: true, implemented: true, mapLayerIds: ["regulations-prohibited-fill", "regulations-prohibited-outline"] },
  { id: "restrictions", labelKey: "restrictions", category: "regulations", defaultVisible: true, implemented: true, mapLayerIds: ["regulations-restricted-fill", "regulations-restricted-outline"] },
  { id: "environmental-information", labelKey: "environmentalInformation", category: "information", defaultVisible: false, implemented: false, mapLayerIds: [] },
  { id: "unknown-status", labelKey: "unknownStatus", category: "information", defaultVisible: false, implemented: false, mapLayerIds: [] },
  { id: "user-location", labelKey: "userLocation", category: "user", defaultVisible: true, implemented: true, mapLayerIds: [] },
] as const;

