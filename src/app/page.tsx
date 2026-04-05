import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-8 text-[var(--color-foreground)] sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]">
          <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-6 sm:gap-8 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-6">
              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Go-Pods Configurator
                </p>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                    Build your dream Go-Pod
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-[var(--color-muted-foreground)] sm:text-lg">
                    Choose a straightforward manual configurator or answer a few
                    quick questions to get pointed toward the right starting
                    setup.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <EntryCard
                  href="/configurator"
                  eyebrow="Manual path"
                  title="Start from scratch"
                  description="Select a model, add accessories and upgrades, review the overall cost and weight, and request a quotation."
                  cta="Start manual configuration"
                  featured
                />
                <EntryCard
                  href="/help-me-choose"
                  eyebrow="Guided path"
                  title="Help me choose"
                  description="Answer five quick questions and we’ll suggest a tailored configuration to suit your needs."
                  cta="Start guided recommendation"
                />
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
