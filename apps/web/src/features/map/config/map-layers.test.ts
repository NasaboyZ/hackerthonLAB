import { describe, expect, it } from "vitest";
import { mapLayers } from "@/features/map/config/map-layers";

describe("map layer registry", () => {
  it("has unique technical ids and separates future layers", () => {
    const ids = mapLayers.map(layer => layer.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(mapLayers.find(layer => layer.id === "environmental-information")?.implemented).toBe(false);
    expect(mapLayers.find(layer => layer.id === "verified-prohibitions")?.mapLayerIds).toContain("regulations-prohibited-fill");
  });
});
