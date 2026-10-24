export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-6 px-6 py-24">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">Magnetrail</p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Explore what the water keeps hidden.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          The technical foundation for a safer, clearer and more connected magnet-fishing experience.
        </p>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          Foundation phase active · Product features will be added in the next phase.
        </div>
      </section>
    </main>
  );
}

