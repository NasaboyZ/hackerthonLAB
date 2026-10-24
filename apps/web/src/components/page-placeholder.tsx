"use client";

import { useTranslations } from "next-intl";

type PagePlaceholderProps = {
  navigationKey: string;
};

export function PagePlaceholder({ navigationKey }: PagePlaceholderProps) {
  const t = useTranslations("Navigation");
  const label = t(`${navigationKey}.label`);

  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground sm:px-10">
      <section className="mx-auto max-w-5xl rounded-2xl border border-border bg-surface p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Magnetrail</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{label}</h1>
      </section>
    </main>
  );
}
