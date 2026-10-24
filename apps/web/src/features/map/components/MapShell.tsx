"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, RotateCcw, Undo2 } from "lucide-react";
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
import { createArea } from "@/features/places/api/places.api";
import { PlaceForm } from "@/features/places/components/PlaceForm";
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
  const [drawMode, setDrawMode] = useState(false);
  const [areaPointCount, setAreaPointCount] = useState(0);
  const [finishAreaRequest, setFinishAreaRequest] = useState(0);
  const [undoAreaRequest, setUndoAreaRequest] = useState(0);
  const [resetAreaRequest, setResetAreaRequest] = useState(0);
  const [areaCoordinates, setAreaCoordinates] = useState<number[][][][] | null>(null);
  const [drawBusy, setDrawBusy] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const regulationCount = data.features.length;
  const locationMessage = locationError ? t(locationError) : null;
  const visibleLayers = useMemo(() => new Set(visibleLayerIds), [visibleLayerIds]);

  useEffect(() => {
    const controller = new AbortController();
    void getRegulations(controller.signal).then(setRules).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const toggleDrawing = () => {
    setDrawMode(value => !value);
    setAreaCoordinates(null);
    setDrawError(null);
  };

  const cancelDrawing = () => {
    setDrawMode(false);
    setAreaCoordinates(null);
    setAreaPointCount(0);
    setDrawError(null);
    setResetAreaRequest(value => value + 1);
  };

  const saveDrawnArea = async (name: string) => {
    if (!areaCoordinates || !name.trim()) return;
    setDrawBusy(true);
    setDrawError(null);
    try {
      await createArea({ name: name.trim(), coordinates: areaCoordinates, visibility: "private" });
      cancelDrawing();
    } catch (error) {
      setDrawError(error instanceof Error && error.message.includes("401") ? t("drawLoginRequired") : t("drawSaveError"));
    } finally {
      setDrawBusy(false);
    }
  };

  return (
    <main className="relative h-[100svh] min-h-[560px] overflow-hidden bg-background">
      <MapCanvas
        visibleLayerIds={visibleLayers}
        locateRequest={locateRequest}
        drawMode={drawMode}
        finishAreaRequest={finishAreaRequest}
        undoAreaRequest={undoAreaRequest}
        resetAreaRequest={resetAreaRequest}
        onStatusChange={setStatus}
        onRegulationsChange={setData}
        onSelectRegulations={setSelected}
        onLocationError={setLocationError}
        onAreaPointCount={setAreaPointCount}
        onAreaCoordinates={setAreaCoordinates}
      />

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex max-w-[calc(100vw-2rem)] flex-col gap-3 sm:bottom-6 sm:left-6">
        <MapStatus status={status} regulationCount={regulationCount} />
        <MapLegend />
        <RegulationCoverageCard rules={rules} />
        {locationMessage ? <p className="rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs text-muted-foreground shadow-lg">{locationMessage}</p> : null}
      </div>

      <div className="pointer-events-none absolute right-4 top-20 z-30 sm:right-6 sm:top-24">
        <MapControls
          drawMode={drawMode}
          onDraw={toggleDrawing}
          onZoomIn={() => window.dispatchEvent(new CustomEvent("magnetrail-map-zoom-in"))}
          onZoomOut={() => window.dispatchEvent(new CustomEvent("magnetrail-map-zoom-out"))}
          onLocate={() => setLocateRequest(value => value + 1)}
          onLayers={() => setLayerPanelOpen(value => !value)}
        />
      </div>

      {drawMode ? <div className="pointer-events-auto absolute right-4 top-[24rem] z-30 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface/95 p-3 text-xs text-muted-foreground shadow-2xl backdrop-blur-sm sm:right-6 sm:top-[24rem]">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground"><Pencil className="size-4 text-accent" />{t("drawArea")}</div>
        {areaCoordinates ? <PlaceForm type="area" onSubmit={saveDrawnArea} onCancel={cancelDrawing} busy={drawBusy} /> : <div className="space-y-3"><p>{t("drawAreaHint", { count: areaPointCount })}</p><div className="flex gap-2"><button type="button" onClick={() => setUndoAreaRequest(value => value + 1)} className="flex-1 rounded-lg border border-border px-3 py-2 hover:bg-hover-surface" aria-label={t("undoPoint")}><Undo2 className="mx-auto size-4" /></button><button type="button" onClick={() => { setResetAreaRequest(value => value + 1); setAreaPointCount(0); }} className="flex-1 rounded-lg border border-border px-3 py-2 hover:bg-hover-surface" aria-label={t("resetArea")}><RotateCcw className="mx-auto size-4" /></button><button type="button" onClick={() => setFinishAreaRequest(value => value + 1)} disabled={areaPointCount < 3} className="flex-[2] rounded-lg bg-accent px-3 py-2 font-semibold text-background disabled:cursor-not-allowed disabled:opacity-40">{t("finishArea")}</button></div>{drawError ? <p className="text-restricted">{drawError}</p> : null}</div>}
      </div> : null}

      {layerPanelOpen ? <div className="absolute right-4 top-20 z-20 sm:right-20 sm:top-24"><MapLayerPanel visibleLayers={visibleLayers} onToggle={id => setVisibleLayerIds(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onClose={() => setLayerPanelOpen(false)} /></div> : null}
      <RegulationDetailPanel features={selected} onClose={() => setSelected([])} />
    </main>
  );
}
