import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-8 text-[var(--color-foreground)] sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Go-Pods Configurator
              </p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Start your Go-Pod journey the way that suits you best.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--color-muted-foreground)] sm:text-lg">
                  Choose a clear manual configurator flow or use a guided
                  starting point to help narrow down the right Go-Pod.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <EntryCard
                  href="/configurator"
                  eyebrow="Manual path"
                  title="Manually configure my Go-Pod"
                  description="Pick a model, add options, review the totals, and send your enquiry directly to the sales team."
                  cta="Start manual configuration"
                  featured
                />
                <EntryCard
                  href="/help-me-choose"
                  eyebrow="Guided path"
                  title="Help me choose"
                  description="Answer five quick questions and get a suggested model, upgrade shortlist, and package overlap nudge."
                  cta="Start guided recommendation"
                />
              </div>
            </div>
            <div className="grid gap-4 rounded-[1.75rem] bg-[var(--color-accent-soft)] p-5 sm:p-6">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  What you can do today
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  <li>Compare the Classic and Pioneer models</li>
                  <li>Review standard specification details before choosing</li>
                  <li>Add practical and styling upgrades</li>
                  <li>Send a live enquiry and download your PDF summary</li>
                </ul>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  What happens next
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  Once you submit, the Go-Pods sales team receives your enquiry
                  with the saved configuration details and can follow up with the
                  next steps.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface EntryCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  featured?: boolean;
}

function EntryCard({
  href,
  eyebrow,
  title,
  description,
  cta,
  featured = false,
}: EntryCardProps) {
  return (
    <Link
      href={href}
      className={[
        "group rounded-[1.5rem] border p-5 transition sm:p-6",
        featured
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-border)] bg-white hover:border-[var(--color-accent)]",
      ].join(" ")}
    >
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-7 text-[var(--color-muted-foreground)]">
            {description}
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition",
            featured
              ? "bg-[var(--color-accent)] text-white group-hover:bg-[var(--color-accent-strong)]"
              : "border border-[var(--color-border-strong)] text-[var(--color-foreground)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]",
          ].join(" ")}
        >
          {cta}
        </span>
      </div>
    </Link>
  );
}
