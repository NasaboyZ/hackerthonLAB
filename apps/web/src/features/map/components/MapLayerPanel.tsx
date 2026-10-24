"use client";

import { Check, LockKeyhole, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { mapLayers } from "@/features/map/config/map-layers";

export function MapLayerPanel({ visibleLayers, onToggle, onClose }: { visibleLayers: ReadonlySet<string>; onToggle: (id: string) => void; onClose: () => void }) {
  const t = useTranslations("Map");
  return <aside className="pointer-events-auto w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface/95 p-4 shadow-2xl backdrop-blur-sm" aria-label={t("layers")}><div className="flex items-center justify-between"><h2 className="font-semibold text-foreground">{t("layers")}</h2><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-hover-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={t("close")}><X size={17} /></button></div><div className="mt-3 space-y-1">{mapLayers.filter(layer => layer.category !== "user").map(layer => <button type="button" key={layer.id} onClick={() => layer.implemented && onToggle(layer.id)} disabled={!layer.implemented} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-hover-surface disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span className={`flex size-5 items-center justify-center rounded-md border ${visibleLayers.has(layer.id) ? "border-accent bg-accent text-background" : "border-border"}`}>{visibleLayers.has(layer.id) ? <Check size={13} strokeWidth={3} /> : null}</span><span className="flex-1">{t(layer.labelKey)}</span>{!layer.implemented ? <LockKeyhole aria-hidden="true" size={14} className="text-muted-foreground" /> : null}</button>)}</div></aside>;
}
