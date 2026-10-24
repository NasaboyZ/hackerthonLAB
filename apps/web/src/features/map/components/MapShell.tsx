"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MapCanvas } from "@/features/map/components/MapCanvas";
import { MapControls } from "@/features/map/components/MapControls";
import { MapLayerPanel } from "@/features/map/components/MapLayerPanel";
import { MapLegend } from "@/features/map/components/MapLegend";
import { MapStatus } from "@/features/map/components/MapStatus";
import { mapLayers } from "@/features/map/config/map-layers";
import { RegulationDetailPanel } from "@/features/regulations/components/RegulationDetailPanel";
import { RegulationCoverageCard } from "@/features/regulations/components/RegulationCoverageCard";
import { getRegulations } from "@/features/regulations/api/regulations.api";
import type { RegulationFeature, RegulationFeatureCollection } from "@/features/regulations/types/regulation.types";
import type { MapStatus as MapStatusType } from "@/features/map/types/map.types";

export function MapShell() {
  const t = useTranslations("Map");
  const [status, setStatus] = useState<MapStatusType>("idle");
  const [data, setData] = useState<RegulationFeatureCollection>({ type: "FeatureCollection", features: [] });
  const [selected, setSelected] = useState<RegulationFeature[]>([]);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [locateRequest, setLocateRequest] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [rules, setRules] = useState<Awaited<ReturnType<typeof getRegulations>>>([]);
  const [visibleLayerIds, setVisibleLayerIds] = useState<ReadonlySet<string>>(() => new Set(mapLayers.filter(layer => layer.defaultVisible).map(layer => layer.id)));
  const regulationCount = data.features.length;
  const locationMessage = locationError ? t(locationError) : null;
  const visibleLayers = useMemo(() => new Set(visibleLayerIds), [visibleLayerIds]);

  useEffect(() => {
    const controller = new AbortController();
    void getRegulations(controller.signal).then(setRules).catch(() => undefined);
    return () => controller.abort();
  }, []);

  return <main className="relative h-[100svh] min-h-[560px] overflow-hidden bg-background"><MapCanvas visibleLayerIds={visibleLayers} locateRequest={locateRequest} onStatusChange={setStatus} onRegulationsChange={setData} onSelectRegulations={setSelected} onLocationError={setLocationError} /><div className="pointer-events-none absolute bottom-4 left-4 z-10 flex max-w-[calc(100vw-2rem)] flex-col gap-3 sm:bottom-6 sm:left-6"><MapStatus status={status} regulationCount={regulationCount} /><MapLegend /><RegulationCoverageCard rules={rules} />{locationMessage ? <p className="rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs text-muted-foreground shadow-lg">{locationMessage}</p> : null}</div><div className="pointer-events-none absolute right-4 top-20 z-30 sm:right-6 sm:top-24"><MapControls onZoomIn={() => window.dispatchEvent(new CustomEvent("magnetrail-map-zoom-in"))} onZoomOut={() => window.dispatchEvent(new CustomEvent("magnetrail-map-zoom-out"))} onLocate={() => setLocateRequest(value => value + 1)} onLayers={() => setLayerPanelOpen(value => !value)} /></div>{layerPanelOpen ? <div className="absolute right-4 top-20 z-20 sm:right-20 sm:top-24"><MapLayerPanel visibleLayers={visibleLayers} onToggle={id => setVisibleLayerIds(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onClose={() => setLayerPanelOpen(false)} /></div> : null}<RegulationDetailPanel features={selected} onClose={() => setSelected([])} /></main>;
}
