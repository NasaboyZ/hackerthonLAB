"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Finding } from "@/features/findings/types/finding.types";

export function FindingsList({ findings, onEdit, onDelete }: { findings: Finding[]; onEdit: (finding: Finding) => void; onDelete: (id: string) => void }) {
  const t = useTranslations("Logbook");
  const locale = useLocale();
  if (findings.length === 0) return <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">{t("empty")}</p>;
  return <div className="space-y-3">{findings.map(finding => <article key={finding.id} className="rounded-xl border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold text-foreground">{finding.title}</h2><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(finding.foundAt))}{finding.category ? ` · ${finding.category}` : ""}{finding.weightGrams !== null ? ` · ${finding.weightGrams} g` : ""}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => onEdit(finding)} className="rounded-lg p-2 text-muted-foreground hover:bg-hover-surface hover:text-foreground" aria-label={`${t("edit")} ${finding.title}`}><Pencil className="size-4" /></button><button type="button" onClick={() => onDelete(finding.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-hover-surface hover:text-restricted" aria-label={`${t("delete")} ${finding.title}`}><Trash2 className="size-4" /></button></div></div>{finding.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{finding.description}</p> : null}{finding.media.length > 0 ? <p className="mt-3 text-xs text-accent">{t("mediaCount", { count: finding.media.length })}</p> : null}</article>)}</div>;
}
