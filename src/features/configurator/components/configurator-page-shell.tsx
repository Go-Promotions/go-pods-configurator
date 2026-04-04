import type {
  ConfiguratorCatalogue,
  ConfiguratorInitialSelections,
} from "@/types/configurator";

import { ConfiguratorFlow } from "./configurator-flow";

interface ConfiguratorPageShellProps {
  catalogue: ConfiguratorCatalogue;
  initialSelections?: ConfiguratorInitialSelections | null;
}

export function ConfiguratorPageShell({
  catalogue,
  initialSelections = null,
}: ConfiguratorPageShellProps) {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 rounded-[1.75rem] border border-[var(--color-border)] bg-white px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <a
                href="https://go-pods.co.uk"
                className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
              >
                Back to go-pods.co.uk
              </a>
              <div className="flex flex-wrap gap-2">
                <a
                  href="tel:+441234816832"
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  Call 01234 816 832
                </a>
                <a
                  href="mailto:sales@go-pods.co.uk"
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  sales@go-pods.co.uk
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full max-w-[220px] sm:max-w-[260px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo/go-pods-logo.svg"
                  alt="Go-Pods"
                  className="h-auto w-full object-contain"
                />
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-[var(--color-accent)] text-balance sm:text-4xl">
                  Build your Go-Pod configuration
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted-foreground)] sm:text-base">
                  Compare models, add options, and send a polished enquiry with
                  a saved summary for the sales team to review.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ConfiguratorFlow catalogue={catalogue} initialSelections={initialSelections} />
      </div>
    </main>
  );
}
