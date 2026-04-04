import Link from "next/link";

export default function HelpMeChoosePage() {
  return (
    <main className="min-h-screen px-5 py-8 text-[var(--color-foreground)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Guided path
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance">
            Help me choose is coming soon.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--color-muted-foreground)]">
            This guided route will help customers narrow down the right Go-Pod
            based on how they travel and what features matter most. For now,
            you can continue with the full manual configurator.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/configurator"
              className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
            >
              Manually configure my Go-Pod
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] px-5 py-3 text-sm font-semibold"
            >
              Back to start
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
