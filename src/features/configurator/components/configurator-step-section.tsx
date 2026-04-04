interface ConfiguratorStepSectionProps {
  stepNumber: number;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ConfiguratorStepSection({
  stepNumber,
  title,
  description,
  children,
  footer,
}: ConfiguratorStepSectionProps) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Step {stepNumber}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--color-muted-foreground)]">
            {description}
          </p>
        </div>
      </div>
      <div className="pt-6">{children}</div>
      {footer ? (
        <div className="mt-8 border-t border-[var(--color-border)] pt-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
