import Link from "next/link";

export function AuthShell({ title, subtitle, children }: Readonly<{ title: string; subtitle: string; children: React.ReactNode }>) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-20 text-foreground"><section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8"><Link href="/map" className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Magnetrail</Link><h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p><div className="mt-8">{children}</div></section></main>;
}
