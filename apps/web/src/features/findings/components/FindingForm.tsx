"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Finding, FindingInput } from "@/features/findings/types/finding.types";

type FindingFormProps = { finding?: Finding | null; busy: boolean; onSubmit: (input: FindingInput) => void; onCancel: () => void };

function toDateInput(value: string) { return value.slice(0, 10); }

export function FindingForm({ finding, busy, onSubmit, onCancel }: FindingFormProps) {
  const t = useTranslations("Logbook");
  const [title, setTitle] = useState(finding?.title ?? "");
  const [description, setDescription] = useState(finding?.description ?? "");
  const [category, setCategory] = useState(finding?.category ?? "");
  const [foundAt, setFoundAt] = useState(toDateInput(finding?.foundAt ?? new Date().toISOString()));
  const [weightGrams, setWeightGrams] = useState(finding?.weightGrams?.toString() ?? "");
  const [longitude, setLongitude] = useState(finding?.geometry?.coordinates[0]?.toString() ?? "");
  const [latitude, setLatitude] = useState(finding?.geometry?.coordinates[1]?.toString() ?? "");
  const [visibility, setVisibility] = useState(finding?.visibility ?? "private");

  return <form className="space-y-4" onSubmit={event => { event.preventDefault(); onSubmit({ title, description, category, foundAt: new Date(`${foundAt}T12:00:00Z`).toISOString(), weightGrams: weightGrams ? Number(weightGrams) : undefined, longitude: longitude ? Number(longitude) : undefined, latitude: latitude ? Number(latitude) : undefined, visibility }); }}>
    <div><label className="mb-1 block text-sm font-medium" htmlFor="finding-title">{t("titleLabel")}</label><input id="finding-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={120} autoFocus className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" /></div>
    <div><label className="mb-1 block text-sm font-medium" htmlFor="finding-description">{t("descriptionLabel")}</label><textarea id="finding-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={4000} rows={3} className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium" htmlFor="finding-category">{t("category")}</label><input id="finding-category" value={category} onChange={event => setCategory(event.target.value)} maxLength={40} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" /></div><div><label className="mb-1 block text-sm font-medium" htmlFor="finding-date">{t("foundAt")}</label><input id="finding-date" type="date" value={foundAt} onChange={event => setFoundAt(event.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" /></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><div><label className="mb-1 block text-sm font-medium" htmlFor="finding-weight">{t("weight")}</label><input id="finding-weight" type="number" min="0" step="1" value={weightGrams} onChange={event => setWeightGrams(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" /></div><div><label className="mb-1 block text-sm font-medium" htmlFor="finding-longitude">{t("longitude")}</label><input id="finding-longitude" type="number" step="any" value={longitude} onChange={event => setLongitude(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" /></div><div><label className="mb-1 block text-sm font-medium" htmlFor="finding-latitude">{t("latitude")}</label><input id="finding-latitude" type="number" step="any" value={latitude} onChange={event => setLatitude(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" /></div></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visibility === "public"} onChange={event => setVisibility(event.target.checked ? "public" : "private")} className="size-4 accent-accent" />{t("public")}</label>
    <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-hover-surface">{t("cancel")}</button><button type="submit" disabled={busy} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-background disabled:opacity-50">{busy ? t("saving") : finding ? t("update") : t("save")}</button></div>
  </form>;
}
