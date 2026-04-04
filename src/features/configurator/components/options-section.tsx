"use client";

import { useRef, useState } from "react";

import { formatPrice } from "@/features/configurator/lib/formatters";
import {
  buildPackageSuggestion,
  getPackageSuggestionLabel,
} from "@/features/configurator/lib/package-suggestions";
import {
  getOptionAvailabilityState,
  getSelectedHigherTierPackageTitlesCoveringPackage,
  getSelectedPackageTitlesCoveringOption,
} from "@/features/configurator/lib/configurator-compatibility";
import type {
  ConfiguratorModel,
  OptionCategory,
  OptionScope,
} from "@/types/configurator";

import { OptionDetailsDialog } from "./option-details-dialog";

interface OptionsSectionProps {
  categories: OptionCategory[];
  scope: OptionScope;
  emptyStateTitle: string;
  selectedModel: ConfiguratorModel | null;
  selectedModelSlug: string | null;
  selectedOptionIds: string[];
  onToggleOption: (optionId: string) => void;
  onApplyPackageSuggestion?: (packageOptionId: string) => void;
  isLocked?: boolean;
  enableSearch?: boolean;
}

interface OptionCardImageProps {
  src: string | null;
  alt: string;
}

function OptionCardImage({ src, alt }: OptionCardImageProps) {
  const [hasImageError, setHasImageError] = useState(false);

  if (src === null || hasImageError) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[var(--color-muted-foreground)]">
        Image coming soon
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain p-4"
        onError={() => setHasImageError(true)}
      />
    </>
  );
}

export function OptionsSection({
  categories,
  scope,
  emptyStateTitle,
  selectedModel,
  selectedModelSlug,
  selectedOptionIds,
  onToggleOption,
  onApplyPackageSuggestion,
  isLocked = false,
  enableSearch = false,
}: OptionsSectionProps) {
  const scopedCategories = categories.filter((category) => category.scope === scope);
  const allScopedOptions = scopedCategories.flatMap((category) => category.options);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [dismissedPackageSuggestionId, setDismissedPackageSuggestionId] =
    useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    scopedCategories[0]?.id ?? null,
  );
  const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const optionCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearchActive = enableSearch && normalizedSearchQuery.length > 0;
  const filteredCategories = !isSearchActive
    ? scopedCategories
    : scopedCategories
        .map((category) => ({
          ...category,
          options: category.options.filter((option) => {
            const haystacks = [
              option.title,
              option.shortDescription,
              option.fullDescription,
              category.name,
            ];

            return haystacks.some((value) =>
              value.toLowerCase().includes(normalizedSearchQuery),
            );
          }),
        }))
        .filter((category) => category.options.length > 0);
  const titleSuggestions = !isSearchActive
    ? []
    : scopedCategories
        .flatMap((category) =>
          category.options.map((option) => ({
            optionId: option.id,
            optionTitle: option.title,
            categoryId: category.id,
            categoryName: category.name,
          })),
        )
        .filter((entry) =>
          entry.optionTitle.toLowerCase().includes(normalizedSearchQuery),
        )
        .slice(0, 6);
  const activeExpandedCategoryId = scopedCategories.some(
    (category) => category.id === expandedCategoryId,
  )
    ? expandedCategoryId
    : (scopedCategories[0]?.id ?? null);
  const packageSuggestion =
    scope === "accessory"
      ? buildPackageSuggestion(selectedOptionIds, allScopedOptions)
      : null;
  const visiblePackageSuggestion =
    packageSuggestion?.packageOption.id === dismissedPackageSuggestionId
      ? null
      : packageSuggestion;

  function scrollCategoryHeadingIntoView(categoryId: string) {
    window.requestAnimationFrame(() => {
      const sectionElement = categorySectionRefs.current[categoryId];

      if (!sectionElement) {
        return;
      }

      const viewportWidth = window.innerWidth;
      const topOffset = viewportWidth < 640 ? 88 : 48;
      const sectionTop =
        sectionElement.getBoundingClientRect().top + window.scrollY - topOffset;

      window.scrollTo({
        top: Math.max(sectionTop, 0),
        behavior: "smooth",
      });
    });
  }

  if (scopedCategories.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-sm leading-6 text-[var(--color-muted-foreground)]">
        {emptyStateTitle}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {enableSearch ? (
        <div className="relative">
          <label
            htmlFor={`${scope}-search`}
            className="mb-2 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            Search accessories and upgrades
          </label>
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <input
                id={`${scope}-search`}
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setIsSuggestionOpen(true);
                }}
                onFocus={() => setIsSuggestionOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setIsSuggestionOpen(false);
                  }, 120);
                }}
                placeholder="Search by option, feature, or category"
                className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-accent)]"
              />
              {searchQuery.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSuggestionOpen(false);
                  }}
                  className="shrink-0 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {isSuggestionOpen && titleSuggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]">
              <p className="border-b border-[var(--color-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                Suggestions
              </p>
              <div className="max-h-72 overflow-y-auto">
                {titleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.optionId}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      setSearchQuery(suggestion.optionTitle);
                      setExpandedCategoryId(suggestion.categoryId);
                      setIsSuggestionOpen(false);
                      window.requestAnimationFrame(() => {
                        optionCardRefs.current[suggestion.optionId]?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      });
                    }}
                    className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-[var(--color-accent-soft)]"
                  >
                    <span className="text-sm font-medium text-[var(--color-foreground)]">
                      {suggestion.optionTitle}
                    </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                      {suggestion.categoryName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedModelSlug === null ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Choose a model in Step 1 to enable option selection and compatibility
          rules.
        </div>
      ) : null}
      {visiblePackageSuggestion ? (
        <div className="rounded-[1.5rem] border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Package suggestion
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
                {`You’ve already covered ${visiblePackageSuggestion.coveredCount} of ${visiblePackageSuggestion.totalIncludedCount} items in the ${getPackageSuggestionLabel(visiblePackageSuggestion.packageOption)}.`}
              </h3>
              <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
                {visiblePackageSuggestion.savings !== null
                  ? `Choosing the package instead could save ${formatPrice(visiblePackageSuggestion.savings)} compared with your current covered selections.`
                  : "The package may be a cleaner way to cover the items already in your configuration."}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDismissedPackageSuggestionId(
                  visiblePackageSuggestion.packageOption.id,
                )
              }
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full border border-[var(--color-border)] bg-white text-lg text-[var(--color-muted-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label="Dismiss package suggestion"
            >
              ×
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <OptionDetailsDialog
              option={visiblePackageSuggestion.packageOption}
              allOptions={allScopedOptions}
              selectedModel={selectedModel}
              selectedOptionIds={selectedOptionIds}
              onToggleOption={onToggleOption}
              isSelectionLocked={isLocked}
              compatibilityLabel="Available as an upgrade package in the current catalogue."
              triggerLabel="View package"
              triggerClassName="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={() =>
                onApplyPackageSuggestion?.(visiblePackageSuggestion.packageOption.id)
              }
              disabled={isLocked || onApplyPackageSuggestion === undefined}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)]"
            >
              Add package instead
            </button>
          </div>
        </div>
      ) : null}
      {isSearchActive && filteredCategories.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-sm leading-6 text-[var(--color-muted-foreground)]">
          No accessories or upgrades match &quot;{searchQuery.trim()}&quot;. Try a
          different keyword or clear the search.
        </div>
      ) : null}
      {filteredCategories.map((category) => (
        <section
          key={category.id}
          ref={(element) => {
            categorySectionRefs.current[category.id] = element;
          }}
          className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]"
        >
          <button
            type="button"
            onClick={() => {
              const isCurrentlyExpanded = activeExpandedCategoryId === category.id;

              setExpandedCategoryId(isCurrentlyExpanded ? null : category.id);

              if (!isCurrentlyExpanded) {
                scrollCategoryHeadingIntoView(category.id);
              }
            }}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
            aria-expanded={
              isSearchActive ? true : activeExpandedCategoryId === category.id
            }
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
                  {category.name}
                </h3>
                <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  {category.options.length} options
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-[var(--color-muted-foreground)]">
                {category.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted-foreground)] sm:inline">
                {isSearchActive
                  ? "Search results"
                  : activeExpandedCategoryId === category.id
                    ? "Collapse"
                    : "Expand"}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-lg text-[var(--color-accent)]"
                aria-hidden="true"
              >
                {isSearchActive
                  ? "•"
                  : activeExpandedCategoryId === category.id
                    ? "−"
                    : "+"}
              </span>
            </div>
          </button>

          {isSearchActive || activeExpandedCategoryId === category.id ? (
            <div className="border-t border-[var(--color-border)] px-4 py-5 sm:px-6">
              {category.options.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  No options are available in this category yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {category.options.map((option) => {
                    const availabilityState = getOptionAvailabilityState(
                      option,
                      selectedModel,
                      selectedOptionIds,
                      allScopedOptions,
                    );
                    const isSelected = selectedOptionIds.includes(option.id);
                    const isDisabled = availabilityState !== "available" || isLocked;
                    const coveringPackageTitles = getSelectedPackageTitlesCoveringOption(
                      option.id,
                      selectedOptionIds,
                      allScopedOptions,
                    );
                    const coveringHigherTierPackageTitles =
                      getSelectedHigherTierPackageTitlesCoveringPackage(
                        option,
                        selectedOptionIds,
                        allScopedOptions,
                      );
                    const compatibilityLabel =
                      availabilityState === "included"
                        ? "Already included with the Go-Pod model you have selected."
                        : availabilityState === "included_in_package"
                          ? `Already included in your selected package${
                              coveringPackageTitles[0]
                                ? `: ${coveringPackageTitles.join(", ")}.`
                                : "."
                            }`
                          : availabilityState === "covered_by_selected_package"
                            ? `Already covered by your selected higher-tier package${
                                coveringHigherTierPackageTitles[0]
                                  ? `: ${coveringHigherTierPackageTitles.join(", ")}.`
                                  : "."
                              }`
                          : option.appliesToAllModels
                            ? "Available across all Go-Pod models."
                            : `Compatible with ${option.compatibleModelSlugs.join(", ")}.`;
                    const imageSource = option.primaryImageUrl?.trim() || null;

                    return (
                      <article
                        key={option.id}
                        ref={(element) => {
                          optionCardRefs.current[option.id] = element;
                        }}
                        className={[
                          "flex h-full flex-col overflow-hidden rounded-[1.4rem] border bg-white transition",
                          isSelected
                            ? "border-[var(--color-accent)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-accent)]"
                            : "border-[var(--color-border)]",
                          isDisabled ? "opacity-70" : "",
                        ].join(" ")}
                      >
                        <div className="relative px-4 pt-4">
                          <div className="aspect-square overflow-hidden rounded-[1.25rem] bg-[var(--color-surface)]">
                            <OptionCardImage src={imageSource} alt={option.title} />
                          </div>
                          {isSelected ? (
                            <span className="absolute left-7 top-7 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                              Selected
                            </span>
                          ) : null}
                        </div>

                        <div className="grid flex-1 grid-rows-[minmax(3.25rem,auto)_auto_minmax(4.5rem,auto)_auto] gap-4 p-4">
                          <div className="flex min-h-[3.25rem] items-start">
                            <h4 className="text-sm font-semibold leading-5 text-[var(--color-foreground)] sm:text-base">
                              {option.title}
                            </h4>
                          </div>

                          <div className="border-t border-[var(--color-border)] pt-3">
                            <p className="text-lg font-semibold text-[var(--color-foreground)]">
                              {formatPrice(option.price)}
                            </p>
                          </div>

                          <div className="space-y-3">
                            {availabilityState === "requires_model" ? (
                              <p className="text-xs leading-5 text-[var(--color-muted-foreground)]">
                                Choose a model first to see if this option can be added.
                              </p>
                            ) : null}

                            {availabilityState === "included" ? (
                              <p className="flex items-start gap-2 text-xs font-medium leading-5 text-[var(--color-accent-strong)]">
                                <span
                                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[11px] text-[var(--color-accent)]"
                                  aria-hidden="true"
                                >
                                  ✓
                                </span>
                                <span>
                                  Already included with the Go-Pod model you have selected.
                                </span>
                              </p>
                            ) : null}

                            {availabilityState === "included_in_package" ? (
                              <p className="flex items-start gap-2 text-xs font-medium leading-5 text-[var(--color-accent-strong)]">
                                <span
                                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[11px] text-[var(--color-accent)]"
                                  aria-hidden="true"
                                >
                                  ✓
                                </span>
                                <span>
                                  Already included in your selected package
                                  {coveringPackageTitles[0]
                                    ? `: ${coveringPackageTitles.join(", ")}`
                                    : "."}
                                </span>
                              </p>
                            ) : null}

                            {availabilityState === "covered_by_selected_package" ? (
                              <p className="flex items-start gap-2 text-xs font-medium leading-5 text-[var(--color-accent-strong)]">
                                <span
                                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[11px] text-[var(--color-accent)]"
                                  aria-hidden="true"
                                >
                                  ✓
                                </span>
                                <span>
                                  Already covered by your selected higher-tier package
                                  {coveringHigherTierPackageTitles[0]
                                    ? `: ${coveringHigherTierPackageTitles.join(", ")}`
                                    : "."}
                                </span>
                              </p>
                            ) : null}

                            {availabilityState === "incompatible" ? (
                              <p className="text-xs leading-5 text-[var(--color-danger)]">
                                Not compatible with your selected Go-Pod.
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-auto">
                            {availabilityState === "included_in_package" ||
                            availabilityState === "covered_by_selected_package" ? null : (
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <OptionDetailsDialog
                                  option={option}
                                  allOptions={allScopedOptions}
                                  selectedModel={selectedModel}
                                  selectedOptionIds={selectedOptionIds}
                                  onToggleOption={onToggleOption}
                                  isSelectionLocked={isLocked}
                                  compatibilityLabel={compatibilityLabel}
                                />
                                <button
                                  type="button"
                                  onClick={() => onToggleOption(option.id)}
                                  disabled={isDisabled}
                                  className={[
                                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
                                    isSelected
                                      ? "border border-[var(--color-border-strong)] bg-white text-[var(--color-foreground)]"
                                      : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)]",
                                    isDisabled
                                      ? "cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]"
                                      : "",
                                  ].join(" ")}
                                >
                                  {availabilityState === "included"
                                    ? "Included"
                                    : isSelected
                                      ? "Remove"
                                      : "Add"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
