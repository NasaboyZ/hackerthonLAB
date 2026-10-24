"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RegulationSummary } from "@/features/regulations/types/regulation.types";

export function RegulationCoverageCard({ rules }: { rules: RegulationSummary[] }) {
  const t = useTranslations("Regulations");
  if (rules.length === 0) return null;
  return <section className="max-w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">{t("coverage")}</h2><span className="rounded-full bg-unknown/15 px-2 py-1 text-[10px] font-medium text-unknown">{t("notChecked")}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{t("coverageDescription")}</p><div className="mt-3 space-y-2">{rules.map(rule => <div key={rule.id} className="flex items-center justify-between gap-3 border-t border-border pt-2 text-xs"><span className="text-foreground">{rule.jurisdiction}</span><a href={rule.sources[0]?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("source")}<ExternalLink size={12} /></a></div>)}</div></section>;
}
