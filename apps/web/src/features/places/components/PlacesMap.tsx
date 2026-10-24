"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { SWISS_BOUNDS, SWISSTOPO_STYLE_URL } from "@/features/map/config/map.config";
import type { Place } from "@/features/places/types/place.types";

type PlacesMapProps = { places: Place[]; captureMode: "spot" | "area" | null; onSpotLocation: (coordinates: [number, number]) => void; onAreaCoordinates: (coordinates: number[][][][]) => void };

export function PlacesMap({ places, captureMode, onSpotLocation, onAreaCoordinates }: PlacesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const areaPointsRef = useRef<[number, number][]>([]);
  const modeRef = useRef(captureMode);
  useEffect(() => { modeRef.current = captureMode; }, [captureMode]);
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({ container: containerRef.current, style: SWISSTOPO_STYLE_URL, bounds: SWISS_BOUNDS, fitBoundsOptions: { padding: 32, maxZoom: 9 }, attributionControl: {}, maxBounds: [[4.5, 45], [12, 48.8]] });
    mapRef.current = map;
    map.on("click", event => { if (modeRef.current === "spot") onSpotLocation([event.lngLat.lng, event.lngLat.lat]); if (modeRef.current === "area") { areaPointsRef.current = [...areaPointsRef.current, [event.lngLat.lng, event.lngLat.lat]]; if (areaPointsRef.current.length >= 3) { const ring = [...areaPointsRef.current, areaPointsRef.current[0]]; onAreaCoordinates([[[...ring]]]); } } });
    return () => { markersRef.current.forEach(marker => marker.remove()); map.remove(); mapRef.current = null; };
  }, [onAreaCoordinates, onSpotLocation]);
  useEffect(() => { markersRef.current.forEach(marker => marker.remove()); markersRef.current = []; const map = mapRef.current; if (!map) return; for (const place of places) { if (place.geometry.type !== "Point") continue; markersRef.current.push(new maplibregl.Marker({ color: "#F2BD66" }).setLngLat(place.geometry.coordinates).addTo(map)); } }, [places]);
  useEffect(() => { areaPointsRef.current = []; }, [captureMode]);
  return <div ref={containerRef} className="min-h-[420px] overflow-hidden rounded-2xl border border-border" aria-label="Karte meiner Orte" role="application" />;
}
