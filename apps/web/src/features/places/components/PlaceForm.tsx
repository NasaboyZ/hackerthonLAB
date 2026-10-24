"use client";

import { useTranslations } from "next-intl";
import type { PlaceType } from "@/features/places/types/place.types";

type PlaceFormProps = {
  type: PlaceType;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  busy: boolean;
};

export function PlaceForm({ type, onSubmit, onCancel, busy }: PlaceFormProps) {
  const t = useTranslations("Places");
  return (
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit(String(form.get("name") ?? "")); }}>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="place-name">{t("name")}</label>
        <input id="place-name" name="name" required maxLength={120} autoFocus className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent focus:ring-2" placeholder={t(type === "spot" ? "spotNamePlaceholder" : "areaNamePlaceholder")} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-hover">{t("cancel")}</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-background disabled:opacity-50">{busy ? t("saving") : t("save")}</button>
      </div>
    </form>
  );
}
