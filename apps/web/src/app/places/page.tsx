"use client";

import { useCallback, useEffect, useState } from "react";
import { Map, Pentagon } from "lucide-react";
import { useTranslations } from "next-intl";
import { createArea, createSpot, deletePlace, getPlaces } from "@/features/places/api/places.api";
import { PlaceForm } from "@/features/places/components/PlaceForm";
import { PlacesList } from "@/features/places/components/PlacesList";
import { PlacesMap } from "@/features/places/components/PlacesMap";
import type { PlaceType } from "@/features/places/types/place.types";

export default function PlacesPage() {
  const t = useTranslations("Places");
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof getPlaces>>>([]);
  const [mode, setMode] = useState<PlaceType | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | number[][][][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => { void getPlaces().then(setPlaces).catch(() => setError(t("loadError"))); }, [t]);
  useEffect(() => { refresh(); }, [refresh]);
  const cancelCapture = useCallback(() => { setMode(null); setCoordinates(null); }, []);
  const handleSpotLocation = useCallback((value: [number, number]) => setCoordinates(value), []);
  const handleAreaCoordinates = useCallback((value: number[][][][]) => setCoordinates(value), []);
  const savePlace = async (name: string) => {
    if (!mode || !coordinates) return;
    setBusy(true); setError(null);
    try {
      const place = mode === "spot" && typeof coordinates[0] === "number"
        ? await createSpot({ name, longitude: coordinates[0] as number, latitude: coordinates[1] as number })
        : await createArea({ name, coordinates: coordinates as number[][][][] });
      setPlaces(current => [place, ...current]); cancelCapture();
    } catch { setError(t("saveError")); } finally { setBusy(false); }
  };
  const removePlace = async (id: string) => { try { await deletePlace(id); setPlaces(current => current.filter(place => place.id !== id)); } catch { setError(t("deleteError")); } };
  return <main className="min-h-screen bg-background px-4 pb-10 pt-24 text-foreground sm:px-8"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><section><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Magnetrail</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("description")}</p></div><PlacesMap places={places} captureMode={mode} onSpotLocation={handleSpotLocation} onAreaCoordinates={handleAreaCoordinates} /></section><aside className="rounded-2xl border border-border bg-surface p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{t("yourPlaces")}</h2><span className="rounded-full bg-elevated px-2 py-1 text-xs text-muted-foreground">{places.length}</span></div>{error ? <p className="mb-4 rounded-lg border border-restricted/40 bg-restricted/10 px-3 py-2 text-sm text-restricted">{error}</p> : null}{mode ? <div className="mb-5 rounded-xl border border-accent/40 bg-background p-4"><p className="mb-3 text-sm text-muted-foreground">{coordinates ? t("locationSelected") : t(mode === "spot" ? "selectSpot" : "drawArea")}</p>{coordinates ? <PlaceForm type={mode} onSubmit={savePlace} onCancel={cancelCapture} busy={busy} /> : <button type="button" onClick={cancelCapture} className="text-sm text-accent hover:underline">{t("cancel")}</button>}</div> : <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1"><button type="button" onClick={() => setMode("spot")} className="flex items-center gap-2 rounded-xl border border-border px-3 py-3 text-left text-sm hover:bg-hover"><Map className="size-4 text-accent" aria-hidden="true" />{t("addSpot")}</button><button type="button" onClick={() => setMode("area")} className="flex items-center gap-2 rounded-xl border border-border px-3 py-3 text-left text-sm hover:bg-hover"><Pentagon className="size-4 text-accent" aria-hidden="true" />{t("addArea")}</button></div>}<PlacesList places={places} onDelete={removePlace} /></aside></div></main>;
}
