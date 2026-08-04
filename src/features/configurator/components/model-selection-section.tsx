import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import {
  getModelAvailabilityLabel,
  isModelSelectable,
  sortModelsByAvailability,
} from "@/features/configurator/lib/model-availability";
import { DEFAULT_MTPLM_KG } from "@/features/configurator/lib/vehicle-constants";
import type { ConfiguratorModel } from "@/types/configurator";

import { ModelSpecDialog } from "./model-spec-dialog";

interface ModelSelectionSectionProps {
  models: ConfiguratorModel[];
  selectedModelSlug: string | null;
  onSelectModel: (modelSlug: string) => void;
  errorMessage?: string;
  isLocked?: boolean;
}

function ModelCardImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  return (
    <div className="relative flex aspect-[4/3] items-center justify-center rounded-[1.25rem] bg-[var(--color-surface)] px-6 text-center">
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-contain p-4"
          />
          <div className="hidden">Model image coming soon</div>
        </>
      ) : (
        <>
          <div className="text-sm font-medium text-[var(--color-muted-foreground)]">
            Model image coming soon
          </div>
          <div className="hidden">
            {/* Placeholder to keep the initial image-slot structure stable */}
          </div>
        </>
      )}
    </div>
  );
}

export function ModelSelectionSection({
  models,
  selectedModelSlug,
  onSelectModel,
  errorMessage,
  isLocked = false,
}: ModelSelectionSectionProps) {
  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-2xl border border-[var(--color-danger)] bg-[rgba(141,79,59,0.08)] p-4 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-2">
        {sortModelsByAvailability(models).map((model) => {
          const isSelected = selectedModelSlug === model.slug;
          const isSelectable = isModelSelectable(model);
          const availabilityLabel = getModelAvailabilityLabel(model.availability);

          return (
            <article
              key={model.id}
              className={[
                "flex h-full flex-col rounded-[1.5rem] border p-6 transition",
                isSelected
                  ? "border-[var(--color-accent)] bg-[#f2f5ef] shadow-[var(--shadow-soft)]"
                  : isSelectable
                    ? "border-[var(--color-border)] bg-[var(--color-surface)]"
                    : "border-[var(--color-border)] bg-[#f7f7f5] opacity-80",
              ].join(" ")}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {model.name}
                  </h3>
                  <span className="text-lg font-semibold text-[var(--color-accent)]">
                    {formatPrice(model.basePrice)}
                  </span>
                  {isSelected ? (
                    <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                      Selected
                    </span>
                  ) : null}
                  {availabilityLabel ? (
                    <span className="rounded-full border border-[#b58a4b] bg-[#fff7eb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a5722]">
                      {availabilityLabel}
                    </span>
                  ) : null}
                </div>
                <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-white">
                  <ModelCardImage
                    src={model.imagePath}
                    alt={`${model.name} model`}
                  />
                </div>
                <p className="max-w-none text-sm leading-6 text-[var(--color-muted-foreground)]">
                  {model.shortDescription}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                    Base MiRO
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {formatWeightKg(model.baseMiro)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                    MTPLM
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {formatWeightKg(DEFAULT_MTPLM_KG)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onSelectModel(model.slug)}
                  disabled={isLocked || !isSelectable}
                  aria-label={
                    isSelectable
                      ? `${isSelected ? "Selected" : "Choose"} ${model.name}`
                      : `${model.name} is ${availabilityLabel?.toLowerCase() ?? "unavailable"}`
                  }
                  className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:bg-[#9a9a92]"
                >
                  {isSelectable
                    ? isSelected
                      ? "Selected model"
                      : "Choose this model"
                    : availabilityLabel ?? "Unavailable"}
                </button>
                <ModelSpecDialog model={model} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
