"use client";

import { useTranslations } from "next-intl";

export function MapLegend() {
  const t = useTranslations("Map");
  return <div className="rounded-2xl border border-border bg-surface/90 p-3 text-xs shadow-lg backdrop-blur-sm"><p className="mb-2 font-semibold text-foreground">{t("legend")}</p><div className="space-y-1.5 text-muted-foreground"><p className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-restricted" />{t("restriction")}</p><p className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-unknown" />{t("notChecked")}</p></div></div>;
}
