"use client";

import { OptionDetailsDialog } from "@/features/configurator/components/option-details-dialog";
import { formatPrice } from "@/features/configurator/lib/formatters";
import type { ConfiguratorModel, ConfiguratorOption } from "@/types/configurator";

interface UpsellSuggestionsSectionProps {
  title?: string;
  description?: string;
  options: ConfiguratorOption[];
  allOptions: ConfiguratorOption[];
  selectedModel: ConfiguratorModel | null;
  selectedOptionIds: string[];
  onToggleOption: (optionId: string) => void;
  isLocked?: boolean;
}

function UpsellCardImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-contain p-4"
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[var(--color-muted-foreground)]">
          Image coming soon
        </div>
      )}
    </div>
  );
}

export function UpsellSuggestionsSection({
  title = "Popular additions",
  description = "You may also want to consider these frequently added extras.",
  options,
  allOptions,
  selectedModel,
  selectedOptionIds,
  onToggleOption,
  isLocked = false,
}: UpsellSuggestionsSectionProps) {
  if (options.length === 0 || selectedModel === null) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
        {title}
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted-foreground)]">
        {description}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => (
          <div
            key={option.id}
            className="flex h-full flex-col rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-soft)]"
          >
            <OptionDetailsDialog
              option={option}
              allOptions={allOptions}
              selectedModel={selectedModel}
              selectedOptionIds={selectedOptionIds}
              onToggleOption={onToggleOption}
              isSelectionLocked={isLocked}
              compatibilityLabel="Available to add to your current Go-Pod configuration."
              triggerClassName="group block flex-1 text-left"
              triggerAriaLabel={`Open details for ${option.title}`}
              triggerContent={
                <div className="flex h-full flex-col">
                  <UpsellCardImage
                    src={option.primaryImageUrl?.trim() || null}
                    alt={option.title}
                  />

                  <div className="mt-4 min-h-0 flex-1 space-y-2">
                    <p className="text-base font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
                      {option.title}
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      {formatPrice(option.price)}
                    </p>
                  </div>

                  <span className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] transition group-hover:border-[var(--color-accent)]">
                    More info
                  </span>
                </div>
              }
            />

            <button
              type="button"
              onClick={() => onToggleOption(option.id)}
              disabled={isLocked}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)]"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
