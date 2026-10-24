"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { createFinding, deleteFinding, getFindings, updateFinding } from "@/features/findings/api/findings.api";
import { FindingForm } from "@/features/findings/components/FindingForm";
import { FindingsList } from "@/features/findings/components/FindingsList";
import type { Finding, FindingInput } from "@/features/findings/types/finding.types";

export default function LogbookPage() {
  const t = useTranslations("Logbook");
  const [findings, setFindings] = useState<Finding[]>([]); const [editing, setEditing] = useState<Finding | null>(null); const [formOpen, setFormOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => { void getFindings().then(setFindings).catch(() => setError(t("loadError"))); }, [t]);
  useEffect(() => { refresh(); }, [refresh]);
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const save = async (input: FindingInput) => { setBusy(true); setError(null); try { if (editing) { const value = await updateFinding(editing.id, input); setFindings(current => current.map(item => item.id === value.id ? value : item)); } else { const value = await createFinding(input); setFindings(current => [value, ...current]); } closeForm(); } catch { setError(t("saveError")); } finally { setBusy(false); } };
  const remove = async (id: string) => { setError(null); try { await deleteFinding(id); setFindings(current => current.filter(item => item.id !== id)); } catch { setError(t("deleteError")); } };
  return <main className="min-h-screen bg-background px-4 pb-10 pt-24 text-foreground sm:px-8"><div className="mx-auto max-w-5xl"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Magnetrail</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("description")}</p></div><button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-background"><Plus className="size-4" />{t("add")}</button></div>{error ? <p role="alert" className="mb-4 rounded-lg border border-restricted/40 bg-restricted/10 px-3 py-2 text-sm text-restricted">{error}</p> : null}<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">{formOpen ? <section className="rounded-2xl border border-border bg-surface p-5"><div className="mb-5 flex items-center gap-2"><BookOpen className="size-5 text-accent" /><h2 className="text-lg font-semibold">{editing ? t("editTitle") : t("newTitle")}</h2></div><FindingForm key={editing?.id ?? "new"} finding={editing} busy={busy} onSubmit={save} onCancel={closeForm} /></section> : <section className="rounded-2xl border border-border bg-surface p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{t("yourFindings")}</h2><span className="rounded-full bg-elevated px-2 py-1 text-xs text-muted-foreground">{findings.length}</span></div><FindingsList findings={findings} onEdit={finding => { setEditing(finding); setFormOpen(true); }} onDelete={remove} /></section>}{formOpen ? <aside className="rounded-2xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">{t("yourFindings")}</h2><div className="mt-4"><FindingsList findings={findings} onEdit={finding => { setEditing(finding); }} onDelete={remove} /></div></aside> : null}</div></div></main>;
}
