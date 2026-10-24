"use client";

import { Layers, LocateFixed, Minus, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

type MapControlsProps = {
  drawMode: boolean;
  onDraw: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onLayers: () => void;
};

export function MapControls({ drawMode, onDraw, onZoomIn, onZoomOut, onLocate, onLayers }: MapControlsProps) {
  const t = useTranslations("Map");
  const buttonClass = "flex size-11 items-center justify-center border-b border-border text-muted-foreground transition-colors first:rounded-t-xl last:rounded-b-xl last:border-b-0 hover:bg-hover-surface hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  return <div className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-border bg-surface/95 shadow-xl backdrop-blur-sm"><button className={`${buttonClass} ${drawMode ? "bg-accent text-background hover:bg-accent" : "text-accent"}`} type="button" onClick={onDraw} aria-label={t("drawArea")} aria-pressed={drawMode}><Pencil size={18} /></button><button className={buttonClass} type="button" onClick={onZoomIn} aria-label={t("zoomIn")}><Plus size={18} /></button><button className={buttonClass} type="button" onClick={onZoomOut} aria-label={t("zoomOut")}><Minus size={18} /></button><button className={buttonClass} type="button" onClick={onLocate} aria-label={t("myLocation")}><LocateFixed size={18} /></button><button className={buttonClass} type="button" onClick={onLayers} aria-label={t("layers")}><Layers size={18} /></button></div>;
}
