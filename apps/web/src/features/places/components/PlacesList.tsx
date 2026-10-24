"use client";

import { MapPin, Pentagon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Place } from "@/features/places/types/place.types";

type PlacesListProps = { places: Place[]; onDelete: (id: string) => void };

export function PlacesList({ places, onDelete }: PlacesListProps) {
  const t = useTranslations("Places");
  if (places.length === 0) return <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">{t("empty")}</p>;
  return <div className="space-y-2">{places.map(place => {
    const Icon = place.type === "spot" ? MapPin : Pentagon;
    return <article key={place.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"><Icon className="size-5 shrink-0 text-accent" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="truncate font-medium text-foreground">{place.name}</p><p className="text-xs text-muted-foreground">{t(place.type)} · {t(place.visibility)}</p></div><button type="button" onClick={() => onDelete(place.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-hover hover:text-foreground" aria-label={`${t("delete")} ${place.name}`}><Trash2 className="size-4" aria-hidden="true" /></button></article>;
  })}</div>;
}
