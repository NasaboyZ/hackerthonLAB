"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MapStatus as MapStatusType } from "@/features/map/types/map.types";

export function MapStatus({ status, regulationCount }: { status: MapStatusType; regulationCount: number }) {
  const t = useTranslations("Map");
  if (status === "idle") return null;
  const content = status === "loading" ? t("loading") : status === "error" ? t("error") : t("ready", { count: regulationCount });
  const Icon = status === "loading" ? LoaderCircle : status === "error" ? AlertTriangle : CheckCircle2;
  return <div className="flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur-sm"><Icon aria-hidden="true" size={14} className={status === "loading" ? "animate-spin" : status === "error" ? "text-restricted" : "text-explored"} /><span>{content}</span></div>;
}
