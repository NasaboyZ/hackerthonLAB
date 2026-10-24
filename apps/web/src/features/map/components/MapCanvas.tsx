"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type MapGeoJSONFeature, type MapMouseEvent, type Marker } from "maplibre-gl";
import { getRegulationsGeoJson } from "@/features/regulations/api/regulations.api";
import { REGULATIONS_SOURCE_ID, SWISS_BOUNDS, SWISSTOPO_STYLE_URL } from "@/features/map/config/map.config";
import type { RegulationFeature, RegulationFeatureCollection } from "@/features/regulations/types/regulation.types";
import type { MapStatus } from "@/features/map/types/map.types";

type MapCanvasProps = {
  visibleLayerIds: ReadonlySet<string>;
  locateRequest: number;
  onStatusChange: (status: MapStatus) => void;
  onRegulationsChange: (data: RegulationFeatureCollection) => void;
  onSelectRegulations: (features: RegulationFeature[]) => void;
  onLocationError: (message: string | null) => void;
};

const emptyCollection: RegulationFeatureCollection = { type: "FeatureCollection", features: [] };

export function MapCanvas({ visibleLayerIds, locateRequest, onStatusChange, onRegulationsChange, onSelectRegulations, onLocationError }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef({ onStatusChange, onRegulationsChange, onSelectRegulations, onLocationError });
  const visibleLayersRef = useRef(visibleLayerIds);
  useEffect(() => {
    callbacksRef.current = { onStatusChange, onRegulationsChange, onSelectRegulations, onLocationError };
    visibleLayersRef.current = visibleLayerIds;
  }, [onLocationError, onRegulationsChange, onSelectRegulations, onStatusChange, visibleLayerIds]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SWISSTOPO_STYLE_URL,
      bounds: SWISS_BOUNDS,
      fitBoundsOptions: { padding: 48, maxZoom: 9 },
      attributionControl: {},
      maxBounds: [[4.5, 45], [12, 48.8]],
    });
    mapRef.current = map;
    callbacksRef.current.onStatusChange("loading");
    const zoomIn = () => map.zoomIn();
    const zoomOut = () => map.zoomOut();
    window.addEventListener("magnetrail-map-zoom-in", zoomIn);
    window.addEventListener("magnetrail-map-zoom-out", zoomOut);

    const updateLayerVisibility = () => {
      const visible = visibleLayersRef.current;
      for (const [registryId, layerIds] of Object.entries({
        "verified-prohibitions": ["regulations-prohibited-fill", "regulations-prohibited-outline"],
        restrictions: ["regulations-restricted-fill", "regulations-restricted-outline"],
      })) {
        for (const layerId of layerIds) {
          if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visible.has(registryId) ? "visible" : "none");
        }
      }
    };

    const loadRegulations = async () => {
      if (!map.isStyleLoaded()) return;
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
      const features = map.queryRenderedFeatures(event.point, { layers: ["regulations-prohibited-fill", "regulations-restricted-fill"] });
      const selected = features.map((feature: MapGeoJSONFeature) => ({ type: "Feature" as const, geometry: { type: "MultiPolygon" as const, coordinates: [] }, properties: feature.properties })) as unknown as RegulationFeature[];
      callbacksRef.current.onSelectRegulations(selected);
    };

    map.on("load", () => {
      map.addSource(REGULATIONS_SOURCE_ID, { type: "geojson", data: emptyCollection });
      map.addLayer({ id: "regulations-prohibited-fill", type: "fill", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "PROHIBITED"], paint: { "fill-color": "#E46F70", "fill-opacity": 0.22 } });
      map.addLayer({ id: "regulations-prohibited-outline", type: "line", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "PROHIBITED"], paint: { "line-color": "#E46F70", "line-width": 2 } });
      map.addLayer({ id: "regulations-restricted-fill", type: "fill", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "RESTRICTED"], paint: { "fill-color": "#E7AA55", "fill-opacity": 0.2 } });
      map.addLayer({ id: "regulations-restricted-outline", type: "line", source: REGULATIONS_SOURCE_ID, filter: ["==", ["get", "classification"], "RESTRICTED"], paint: { "line-color": "#E7AA55", "line-width": 2 } });
      updateLayerVisibility();
      map.on("click", ["regulations-prohibited-fill", "regulations-restricted-fill"], handleRegulationClick);
      map.on("mouseenter", ["regulations-prohibited-fill", "regulations-restricted-fill"], () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", ["regulations-prohibited-fill", "regulations-restricted-fill"], () => { map.getCanvas().style.cursor = ""; });
      void loadRegulations();
    });
    map.on("moveend", () => { void loadRegulations(); });
    map.on("error", () => callbacksRef.current.onStatusChange("error"));

    return () => {
      abortRef.current?.abort();
      markerRef.current?.remove();
      window.removeEventListener("magnetrail-map-zoom-in", zoomIn);
      window.removeEventListener("magnetrail-map-zoom-out", zoomOut);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const visible = visibleLayerIds;
    for (const [registryId, layerIds] of Object.entries({ "verified-prohibitions": ["regulations-prohibited-fill", "regulations-prohibited-outline"], restrictions: ["regulations-restricted-fill", "regulations-restricted-outline"] })) {
      for (const layerId of layerIds) if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visible.has(registryId) ? "visible" : "none");
    }
  }, [visibleLayerIds]);

  useEffect(() => {
    if (locateRequest === 0 || !mapRef.current) return;
    if (!navigator.geolocation) { callbacksRef.current.onLocationError("geolocation-unavailable"); return; }
    navigator.geolocation.getCurrentPosition(position => {
      const map = mapRef.current;
      if (!map) return;
      const lngLat: [number, number] = [position.coords.longitude, position.coords.latitude];
      markerRef.current?.remove();
      markerRef.current = new maplibregl.Marker({ color: "#3FC4A4" }).setLngLat(lngLat).addTo(map);
      map.flyTo({ center: lngLat, zoom: Math.max(map.getZoom(), 13), essential: true });
      callbacksRef.current.onLocationError(null);
    }, () => callbacksRef.current.onLocationError("geolocation-denied"), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }, [locateRequest]);

  return <div ref={containerRef} className="absolute inset-0" aria-label="Interaktive Karte der Schweiz" role="application" />;
}
