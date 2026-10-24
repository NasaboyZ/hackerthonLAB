"use client";

import { useEffect, useRef } from "react";
import type { GeoJSONSource, MapGeoJSONFeature, MapMouseEvent, Marker } from "maplibre-gl";
import { Map as Mapcn, useMap } from "@/components/ui/map";
import { getRegulationsGeoJson } from "@/features/regulations/api/regulations.api";
import { BASEL_BOUNDS, BASEMAP_STYLE_URL, MAP_COLORS, REGULATIONS_SOURCE_ID } from "@/features/map/config/map.config";
import type { RegulationFeature, RegulationFeatureCollection } from "@/features/regulations/types/regulation.types";
import type { MapStatus } from "@/features/map/types/map.types";

type MapCanvasProps = {
  visibleLayerIds: ReadonlySet<string>;
  locateRequest: number;
  drawMode: boolean;
  finishAreaRequest: number;
  undoAreaRequest: number;
  resetAreaRequest: number;
  onStatusChange: (status: MapStatus) => void;
  onRegulationsChange: (data: RegulationFeatureCollection) => void;
  onSelectRegulations: (features: RegulationFeature[]) => void;
  onLocationError: (message: string | null) => void;
  onAreaPointCount: (count: number) => void;
  onAreaCoordinates: (coordinates: number[][][][]) => void;
};

const emptyCollection: RegulationFeatureCollection = { type: "FeatureCollection", features: [] };
const regulationLayerIds = {
  "verified-prohibitions": ["regulations-prohibited-fill", "regulations-prohibited-outline"],
  restrictions: ["regulations-restricted-fill", "regulations-restricted-outline"],
};

function applyBrandMapTheme(map: import("maplibre-gl").Map) {
  for (const layer of map.getStyle().layers ?? []) {
    const layerId = layer.id.toLowerCase();
    const sourceLayer = "source-layer" in layer && typeof layer["source-layer"] === "string" ? layer["source-layer"].toLowerCase() : "";
    const isWater = sourceLayer.includes("water") || layerId.includes("water");
    const isRoad = sourceLayer.includes("road") || sourceLayer.includes("transport") || layerId.includes("road");
    const isBuilding = sourceLayer.includes("building") || layerId.includes("building");
    const isPark = sourceLayer.includes("park") || sourceLayer.includes("landuse") || layerId.includes("park");

    try {
      if (layer.type === "background") map.setPaintProperty(layer.id, "background-color", "#101010");
      if (layer.type === "fill") map.setPaintProperty(layer.id, "fill-color", isWater ? "#19343a" : isBuilding ? "#1f1f1f" : isPark ? "#202b26" : "#171717");
      if (layer.type === "fill-extrusion") map.setPaintProperty(layer.id, "fill-extrusion-color", "#1f1f1f");
      if (layer.type === "line") map.setPaintProperty(layer.id, "line-color", isWater ? "#2b6770" : isRoad ? "#414141" : "#575757");
      if (layer.type === "symbol") {
        if (layer.layout?.["text-field"]) {
          map.setPaintProperty(layer.id, "text-color", "#ac9882");
          map.setPaintProperty(layer.id, "text-halo-color", "#101010");
        }
        if (layer.layout?.["icon-image"]) map.setPaintProperty(layer.id, "icon-color", "#ffb62f");
      }
    } catch {
      // A style layer can omit a paint property or use an unsupported expression.
    }
  }
}

function MapRuntime({ visibleLayerIds, locateRequest, drawMode, finishAreaRequest, undoAreaRequest, resetAreaRequest, onStatusChange, onRegulationsChange, onSelectRegulations, onLocationError, onAreaPointCount, onAreaCoordinates }: MapCanvasProps) {
  const { map, mapLib, isLoaded } = useMap();
  const markerRef = useRef<Marker | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef({ onStatusChange, onRegulationsChange, onSelectRegulations, onLocationError });
  const visibleLayersRef = useRef(visibleLayerIds);
  const drawModeRef = useRef(drawMode);
  const drawPointsRef = useRef<[number, number][]>([]);

  useEffect(() => {
    callbacksRef.current = { onStatusChange, onRegulationsChange, onSelectRegulations, onLocationError };
    visibleLayersRef.current = visibleLayerIds;
    drawModeRef.current = drawMode;
  }, [drawMode, onLocationError, onRegulationsChange, onSelectRegulations, onStatusChange, visibleLayerIds]);

  useEffect(() => {
    if (!map || !mapLib || !isLoaded) return;

    applyBrandMapTheme(map);

    const updateLayerVisibility = () => {
      for (const [registryId, layerIds] of Object.entries(regulationLayerIds)) {
        for (const layerId of layerIds) {
          if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibleLayersRef.current.has(registryId) ? "visible" : "none");
        }
      }
    };

    const loadRegulations = async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const bounds = map.getBounds();
      const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(",");
      try {
        const data = await getRegulationsGeoJson(bbox, controller.signal);
        const source = map.getSource(REGULATIONS_SOURCE_ID) as GeoJSONSource | undefined;
        source?.setData(data as never);
        callbacksRef.current.onRegulationsChange(data);
        callbacksRef.current.onStatusChange("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        callbacksRef.current.onStatusChange("error");
      }
    };

    const handleRegulationClick = (event: MapMouseEvent) => {
      if (drawModeRef.current) return;
      const features = map.queryRenderedFeatures(event.point, { layers: ["regulations-prohibited-fill", "regulations-restricted-fill"] });
      const selected = features.map((feature: MapGeoJSONFeature) => ({ type: "Feature" as const, geometry: { type: "MultiPolygon" as const, coordinates: [] }, properties: feature.properties })) as unknown as RegulationFeature[];
      callbacksRef.current.onSelectRegulations(selected);
    };

    const updateDrawing = () => {
      const source = map.getSource("magnetrail-discover-draft") as GeoJSONSource | undefined;
      if (!source) return;
      const points = drawPointsRef.current;
      const pointFeatures = points.map(point => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: point }, properties: {} }));
      const line = points.length > 1 ? [{ type: "Feature" as const, geometry: { type: "LineString" as const, coordinates: points }, properties: {} }] : [];
      const polygon = points.length >= 3 ? [{ type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [[...points, points[0]]] }, properties: {} }] : [];
      source.setData({ type: "FeatureCollection", features: [...pointFeatures, ...line, ...polygon] });
      onAreaPointCount(points.length);
    };
    const handleMapClick = (event: MapMouseEvent) => {
      const regulationFeatures = map.queryRenderedFeatures(event.point, { layers: ["regulations-prohibited-fill", "regulations-restricted-fill"] });
      if (!drawModeRef.current) {
        if (regulationFeatures.length === 0) callbacksRef.current.onSelectRegulations([]);
        return;
      }
      callbacksRef.current.onSelectRegulations([]);
      drawPointsRef.current = [...drawPointsRef.current, [event.lngLat.lng, event.lngLat.lat]];
      updateDrawing();
    };

    map.addSource(REGULATIONS_SOURCE_ID, { type: "geojson", data: emptyCollection });
    map.addLayer({ id: "regulations-prohibited-fill", type: "fill", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "PROHIBITED"], paint: { "fill-color": MAP_COLORS.prohibited, "fill-opacity": 0.32 } });
    map.addLayer({ id: "regulations-prohibited-outline", type: "line", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "PROHIBITED"], paint: { "line-color": MAP_COLORS.prohibited, "line-width": 2.5, "line-dasharray": [2, 1] } });
    map.addLayer({ id: "regulations-restricted-fill", type: "fill", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "RESTRICTED"], paint: { "fill-color": MAP_COLORS.restricted, "fill-opacity": 0.28 } });
    map.addLayer({ id: "regulations-restricted-outline", type: "line", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "RESTRICTED"], paint: { "line-color": MAP_COLORS.restricted, "line-width": 2.5 } });
    map.addSource("magnetrail-discover-draft", { type: "geojson", data: emptyCollection });
    map.addLayer({ id: "magnetrail-discover-draft-fill", type: "fill", source: "magnetrail-discover-draft", paint: { "fill-color": MAP_COLORS.restricted, "fill-opacity": 0.2 } });
    map.addLayer({ id: "magnetrail-discover-draft-line", type: "line", source: "magnetrail-discover-draft", paint: { "line-color": MAP_COLORS.accent, "line-width": 3, "line-dasharray": [2, 1] } });
    map.addLayer({ id: "magnetrail-discover-draft-points", type: "circle", source: "magnetrail-discover-draft", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-color": MAP_COLORS.accent, "circle-radius": 5, "circle-stroke-color": "#101010", "circle-stroke-width": 2 } });
    updateLayerVisibility();
    map.on("click", ["regulations-prohibited-fill", "regulations-restricted-fill"], handleRegulationClick);
    map.on("click", handleMapClick);
    map.on("mouseenter", ["regulations-prohibited-fill", "regulations-restricted-fill"], () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", ["regulations-prohibited-fill", "regulations-restricted-fill"], () => { map.getCanvas().style.cursor = ""; });
    map.on("moveend", loadRegulations);
    map.on("error", () => callbacksRef.current.onStatusChange("error"));
    const zoomIn = () => map.zoomIn();
    const zoomOut = () => map.zoomOut();
    window.addEventListener("magnetrail-map-zoom-in", zoomIn);
    window.addEventListener("magnetrail-map-zoom-out", zoomOut);
    callbacksRef.current.onStatusChange("loading");
    void loadRegulations();

    return () => {
      abortRef.current?.abort();
      markerRef.current?.remove();
      window.removeEventListener("magnetrail-map-zoom-in", zoomIn);
      window.removeEventListener("magnetrail-map-zoom-out", zoomOut);
      map.off("click", ["regulations-prohibited-fill", "regulations-restricted-fill"], handleRegulationClick);
      map.off("click", handleMapClick);
      map.off("moveend", loadRegulations);
      for (const layerId of Object.values(regulationLayerIds).flat().reverse()) if (map.getLayer(layerId)) map.removeLayer(layerId);
      for (const layerId of ["magnetrail-discover-draft-points", "magnetrail-discover-draft-line", "magnetrail-discover-draft-fill"]) if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(REGULATIONS_SOURCE_ID)) map.removeSource(REGULATIONS_SOURCE_ID);
      if (map.getSource("magnetrail-discover-draft")) map.removeSource("magnetrail-discover-draft");
    };
  }, [isLoaded, map, mapLib, onAreaPointCount]);

  useEffect(() => {
    if (!drawMode) {
      drawPointsRef.current = [];
      onAreaPointCount(0);
      const source = map?.getSource("magnetrail-discover-draft") as GeoJSONSource | undefined;
      source?.setData(emptyCollection);
    }
  }, [drawMode, map, onAreaPointCount]);

  useEffect(() => {
    if (finishAreaRequest === 0 || drawPointsRef.current.length < 3) return;
    const ring = [...drawPointsRef.current, drawPointsRef.current[0]];
    onAreaCoordinates([[[...ring]]]);
  }, [finishAreaRequest, onAreaCoordinates]);

  useEffect(() => {
    if (undoAreaRequest === 0) return;
    drawPointsRef.current = drawPointsRef.current.slice(0, -1);
    const source = map?.getSource("magnetrail-discover-draft") as GeoJSONSource | undefined;
    if (source) {
      const points = drawPointsRef.current;
      source.setData({ type: "FeatureCollection", features: points.map(point => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: point }, properties: {} })) });
    }
    onAreaPointCount(drawPointsRef.current.length);
  }, [map, onAreaPointCount, undoAreaRequest]);

  useEffect(() => {
    if (resetAreaRequest === 0) return;
    drawPointsRef.current = [];
    const source = map?.getSource("magnetrail-discover-draft") as GeoJSONSource | undefined;
    source?.setData(emptyCollection);
    onAreaPointCount(0);
  }, [map, onAreaPointCount, resetAreaRequest]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    for (const [registryId, layerIds] of Object.entries(regulationLayerIds)) {
      for (const layerId of layerIds) if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibleLayerIds.has(registryId) ? "visible" : "none");
    }
  }, [isLoaded, map, visibleLayerIds]);

  useEffect(() => {
    if (locateRequest === 0 || !map || !mapLib || !isLoaded) return;
    if (!navigator.geolocation) { callbacksRef.current.onLocationError("geolocation-unavailable"); return; }
    navigator.geolocation.getCurrentPosition(position => {
      const lngLat: [number, number] = [position.coords.longitude, position.coords.latitude];
      markerRef.current?.remove();
      markerRef.current = new mapLib.Marker({ color: MAP_COLORS.accent }).setLngLat(lngLat).addTo(map);
      map.flyTo({ center: lngLat, zoom: Math.max(map.getZoom(), 13), essential: true });
      callbacksRef.current.onLocationError(null);
    }, () => callbacksRef.current.onLocationError("geolocation-denied"), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }, [isLoaded, locateRequest, map, mapLib]);

  return null;
}

export function MapCanvas(props: MapCanvasProps) {
  return (
    <Mapcn
      className="absolute inset-0"
      styles={{ light: BASEMAP_STYLE_URL, dark: BASEMAP_STYLE_URL }}
      bounds={BASEL_BOUNDS}
      fitBoundsOptions={{ padding: 48, maxZoom: 12 }}
      attributionControl={{}}
      maxBounds={[[4.5, 45], [12, 48.8]]}
      renderWorldCopies={false}
    >
      <MapRuntime {...props} />
    </Mapcn>
  );
}
