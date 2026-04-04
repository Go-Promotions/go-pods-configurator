"use client";

import { useId, useMemo, useRef, useState, type MouseEvent, type ReactNode, type UIEvent } from "react";

import {
  getOptionAvailabilityState,
  getSelectedHigherTierPackageTitlesCoveringPackage,
  getSelectedMutuallyExclusiveOption,
  getSelectedPackageTitlesCoveringOption,
} from "@/features/configurator/lib/configurator-compatibility";
import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import type { ConfiguratorModel, ConfiguratorOption } from "@/types/configurator";

import { OptionDescriptionContent } from "./option-description-content";

interface GalleryImage {
  id: string;
  imagePath: string;
  altText: string;
}

function buildGalleryImages(option: ConfiguratorOption): GalleryImage[] {
  const galleryImages: GalleryImage[] = [];
  const seenPaths = new Set<string>();

  function pushImage(image: GalleryImage) {
    const normalizedPath = image.imagePath.trim();

    if (normalizedPath.length === 0 || seenPaths.has(normalizedPath)) {
      return;
    }

    galleryImages.push({
      ...image,
      imagePath: normalizedPath,
    });
    seenPaths.add(normalizedPath);
  }

  if (option.primaryImageUrl) {
    pushImage({
      id: `${option.id}-primary-image`,
      imagePath: option.primaryImageUrl,
      altText: option.title,
    });
  }

  const supportingImages = [...option.images]
    .sort((leftImage, rightImage) => leftImage.sortOrder - rightImage.sortOrder)
    .slice(0, 6);

  for (const image of supportingImages) {
    pushImage({
      id: image.id,
      imagePath: image.imagePath,
      altText: image.altText || option.title,
    });

    if (galleryImages.length >= 4) {
      break;
    }
  }

  return galleryImages;
}

interface OptionGalleryImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

function OptionGalleryImage({
  src,
  alt,
  className = "h-full w-full object-contain p-4",
}: OptionGalleryImageProps) {
  const [hasImageError, setHasImageError] = useState(false);

  if (src === null || hasImageError) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[var(--color-muted-foreground)]">
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
        className={className}
        onError={() => setHasImageError(true)}
      />
    </>
  );
}

interface OptionDetailsDialogProps {
  option: ConfiguratorOption;
  allOptions?: ConfiguratorOption[];
  selectedModel?: ConfiguratorModel | null;
  selectedOptionIds?: string[];
  onToggleOption?: (optionId: string) => void;
  isSelectionLocked?: boolean;
  compatibilityLabel: string;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerContent?: ReactNode;
  triggerAriaLabel?: string;
}

export function OptionDetailsDialog({
  option,
  allOptions = [],
  selectedModel = null,
  selectedOptionIds = [],
  onToggleOption,
  isSelectionLocked = false,
  compatibilityLabel,
  triggerLabel = "More info",
  triggerClassName = "text-sm font-semibold text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]",
  triggerContent,
  triggerAriaLabel,
}: OptionDetailsDialogProps) {
  const dialogId = useId();
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [activeOption, setActiveOption] = useState(option);
  const [originPackageOption, setOriginPackageOption] = useState<ConfiguratorOption | null>(
    option.includedOptionIds.length > 0 ? option : null,
  );
  const galleryImages = useMemo(() => buildGalleryImages(activeOption), [activeOption]);
  const linkedIncludedOptions = useMemo(() => {
    return activeOption.includedOptionIds
      .map((includedOptionId) =>
        allOptions.find((candidate) => candidate.id === includedOptionId),
      )
      .filter((candidate): candidate is ConfiguratorOption => candidate !== undefined);
  }, [activeOption.includedOptionIds, allOptions]);
  const packageOptionsIncludingActiveOption = useMemo(() => {
    return allOptions.filter(
      (candidate) =>
        candidate.id !== activeOption.id &&
        candidate.includedOptionIds.includes(activeOption.id),
    );
  }, [activeOption.id, allOptions]);
  const [activeImagePath, setActiveImagePath] = useState<string | null>(
    galleryImages[0]?.imagePath ?? null,
  );
  const activeImage =
    galleryImages.find((image) => image.imagePath === activeImagePath) ??
    galleryImages[0] ??
    null;
  const isViewingPackageDrillIn =
    originPackageOption !== null && activeOption.id !== originPackageOption.id;
  const activeAvailabilityState = getOptionAvailabilityState(
    activeOption,
    selectedModel,
    selectedOptionIds,
    allOptions,
  );
  const isSelected = selectedOptionIds.includes(activeOption.id);
  const coveringPackageTitles = getSelectedPackageTitlesCoveringOption(
    activeOption.id,
    selectedOptionIds,
    allOptions,
  );
  const coveringHigherTierPackageTitles =
    getSelectedHigherTierPackageTitlesCoveringPackage(
      activeOption,
      selectedOptionIds,
      allOptions,
    );
  const mutuallyExclusiveSelectedOption = getSelectedMutuallyExclusiveOption(
    activeOption,
    selectedOptionIds,
    allOptions,
  );
  const displayedCompatibilityLabel =
    activeOption.id === option.id
      ? compatibilityLabel
      : "Included within the selected package and available in the current catalogue.";
  const selectionActionCopy = getSelectionActionCopy({
    activeAvailabilityState,
    isSelected,
    isSelectionLocked,
    coveringPackageTitles,
    coveringHigherTierPackageTitles,
    mutuallyExclusiveSelectedOptionTitle: mutuallyExclusiveSelectedOption?.title ?? null,
  });

  function resetModalScroll(behavior: ScrollBehavior) {
    modalScrollRef.current?.scrollTo({
      top: 0,
      behavior,
    });
    lastScrollTopRef.current = 0;
    setIsHeaderVisible(true);
  }

  function handleOpen() {
    setActiveOption(option);
    setOriginPackageOption(option.includedOptionIds.length > 0 ? option : null);
    const nextImages = buildGalleryImages(option);
    setActiveImagePath(nextImages[0]?.imagePath ?? null);
    resetModalScroll("auto");
    setIsOpen(true);
  }

  function handleSwitchOption(
    nextOption: ConfiguratorOption,
    packageContextOption: ConfiguratorOption | null = originPackageOption,
  ) {
    setActiveOption(nextOption);
    setOriginPackageOption(packageContextOption);
    const nextImages = buildGalleryImages(nextOption);
    setActiveImagePath(nextImages[0]?.imagePath ?? null);
    resetModalScroll("smooth");
  }

  function handleReturnToPackage() {
    if (originPackageOption === null) {
      return;
    }

    setActiveOption(originPackageOption);
    const nextImages = buildGalleryImages(originPackageOption);
    setActiveImagePath(nextImages[0]?.imagePath ?? null);
    resetModalScroll("smooth");
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  }

  function handleModalScroll(event: UIEvent<HTMLDivElement>) {
    const nextScrollTop = Math.max(event.currentTarget.scrollTop, 0);
    const scrollDelta = nextScrollTop - lastScrollTopRef.current;

    if (nextScrollTop <= 24) {
      setIsHeaderVisible(true);
      lastScrollTopRef.current = nextScrollTop;
      return;
    }

    if (scrollDelta > 18) {
      setIsHeaderVisible(false);
    } else if (scrollDelta < -18) {
      setIsHeaderVisible(true);
    }

    lastScrollTopRef.current = nextScrollTop;
  }

  function handleToggleActiveOption() {
    if (
      onToggleOption === undefined ||
      isSelectionLocked ||
      selectionActionCopy.isDisabled
    ) {
      return;
    }

    onToggleOption(activeOption.id);
  }

  function renderSelectionActionArea(position: "top" | "bottom") {
    return (
      <div
        className={[
          "rounded-2xl border p-4",
          selectionActionCopy.isPositiveState
            ? "border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)]"
            : selectionActionCopy.isDisabled
              ? "border-[var(--color-border)] bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-white",
          position === "bottom" ? "mt-6" : "mt-6",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              {selectionActionCopy.heading}
            </p>
            <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
              {selectionActionCopy.message}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleActiveOption}
            disabled={
              selectionActionCopy.isDisabled ||
              isSelectionLocked ||
              onToggleOption === undefined
            }
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition sm:min-w-[220px]",
              isSelected
                ? "border border-[var(--color-border-strong)] bg-white text-[var(--color-foreground)]"
                : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)]",
              selectionActionCopy.isDisabled || onToggleOption === undefined
                ? "cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]"
                : "",
            ].join(" ")}
          >
            {selectionActionCopy.buttonLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={triggerClassName}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-label={triggerAriaLabel}
      >
        {triggerContent ?? triggerLabel}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,36,48,0.55)] p-4"
          onClick={handleBackdropClick}
        >
          <div
            id={dialogId}
            ref={modalScrollRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:p-8"
            onScroll={handleModalScroll}
          >
            <div
              className={[
                "sticky top-0 z-20 -mx-5 border-b border-[var(--color-border)] bg-white px-5 pb-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition duration-200 will-change-transform sm:-mx-8 sm:px-8",
                isHeaderVisible
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-[calc(100%+1rem)] opacity-0",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="space-y-3">
                  {isViewingPackageDrillIn ? (
                    <button
                      type="button"
                      onClick={handleReturnToPackage}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    >
                      Back to package
                    </button>
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Option details
                  </p>
                  <h3
                    id={`${dialogId}-title`}
                    className="text-2xl font-semibold tracking-tight"
                  >
                    {activeOption.title}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
                    {activeOption.shortDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>

            {renderSelectionActionArea("top")}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:col-span-2">
                <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-[var(--color-surface)] sm:aspect-[4/3]">
                  <OptionGalleryImage
                    src={activeImage?.imagePath ?? null}
                    alt={activeImage?.altText ?? activeOption.title}
                    className="h-full w-full object-contain p-5"
                  />
                </div>

                {galleryImages.length > 1 ? (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {galleryImages.map((image) => {
                      const isActive = image.imagePath === activeImage?.imagePath;

                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => setActiveImagePath(image.imagePath)}
                          className={[
                            "overflow-hidden rounded-xl border bg-[var(--color-surface)] transition",
                            isActive
                              ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-accent)]",
                          ].join(" ")}
                          aria-label={`View image ${galleryImages.indexOf(image) + 1} for ${activeOption.title}`}
                          aria-pressed={isActive}
                        >
                          <div className="aspect-square">
                            <OptionGalleryImage
                              src={image.imagePath}
                              alt={image.altText}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Price
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-foreground)]">
                  {formatPrice(activeOption.price)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Added weight
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-foreground)]">
                  {formatWeightKg(activeOption.weight)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Compatibility
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  {displayedCompatibilityLabel}
                </p>
              </div>
              {packageOptionsIncludingActiveOption.length > 0 ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    Also available in these packages
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {packageOptionsIncludingActiveOption.map((packageOption) => (
                      <button
                        key={packageOption.id}
                        type="button"
                        onClick={() => handleSwitchOption(packageOption, packageOption)}
                        className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                      >
                        {packageOption.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {linkedIncludedOptions.length > 0 ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    Explore included items
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {linkedIncludedOptions.map((linkedOption) => {
                      const isAlreadySelectedIndividually = selectedOptionIds.includes(
                        linkedOption.id,
                      );

                      return (
                        <button
                          key={linkedOption.id}
                          type="button"
                          onClick={() => handleSwitchOption(linkedOption)}
                          className={[
                            "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition",
                            isAlreadySelectedIndividually
                              ? "border-[#39B54A] bg-[#39B54A] text-white hover:bg-[#2f9b3d]"
                              : "border-[var(--color-border-strong)] bg-white text-[var(--color-foreground)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                          ].join(" ")}
                        >
                          {isAlreadySelectedIndividually ? (
                            <span
                              aria-hidden="true"
                              className="mr-2 text-sm font-semibold"
                            >
                              ✓
                            </span>
                          ) : null}
                          {linkedOption.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Description
                </p>
                <OptionDescriptionContent
                  description={activeOption.fullDescription}
                  className="mt-3 space-y-4"
                />
              </div>
            </div>

            {renderSelectionActionArea("bottom")}
          </div>
        </div>
      ) : null}
    </>
  );
}

interface SelectionActionCopyParams {
  activeAvailabilityState:
    | "requires_model"
    | "included"
    | "included_in_package"
    | "covered_by_selected_package"
    | "exclusive_with_selected"
    | "available"
    | "incompatible";
  isSelected: boolean;
  isSelectionLocked: boolean;
  coveringPackageTitles: string[];
  coveringHigherTierPackageTitles: string[];
  mutuallyExclusiveSelectedOptionTitle: string | null;
}

function getSelectionActionCopy({
  activeAvailabilityState,
  isSelected,
  isSelectionLocked,
  coveringPackageTitles,
  coveringHigherTierPackageTitles,
  mutuallyExclusiveSelectedOptionTitle,
}: SelectionActionCopyParams) {
  if (isSelectionLocked) {
    return {
      heading: "Configuration is being submitted",
      message:
        "Please wait until submission completes before changing your selected options.",
      buttonLabel: "Please wait",
      isDisabled: true,
      isPositiveState: false,
    };
  }

  if (isSelected) {
    return {
      heading: "Added to your configuration",
      message:
        "This option is already part of your current Go-Pod configuration and can be removed here if needed.",
      buttonLabel: "Remove from configuration",
      isDisabled: false,
      isPositiveState: false,
    };
  }

  if (activeAvailabilityState === "requires_model") {
    return {
      heading: "Choose a model first",
      message:
        "Select your Go-Pod model in Step 1 to confirm whether this option can be added.",
      buttonLabel: "Choose a model first",
      isDisabled: true,
      isPositiveState: false,
    };
  }

  if (activeAvailabilityState === "included") {
    return {
      heading: "Already included with your model",
      message:
        "This option is already included with the Go-Pod model you have selected, so you do not need to add it separately.",
      buttonLabel: "Included with model",
      isDisabled: true,
      isPositiveState: true,
    };
  }

  if (activeAvailabilityState === "included_in_package") {
    return {
      heading: "Already covered by your selected package",
      message: coveringPackageTitles[0]
        ? `This option is already included in your selected package: ${coveringPackageTitles.join(", ")}.`
        : "This option is already included in one of your selected packages.",
      buttonLabel: "Included in package",
      isDisabled: true,
      isPositiveState: true,
    };
  }

  if (activeAvailabilityState === "covered_by_selected_package") {
    return {
      heading: "Already covered by your selected higher-tier package",
      message: coveringHigherTierPackageTitles[0]
        ? `This package is already covered by your selected higher-tier package: ${coveringHigherTierPackageTitles.join(", ")}.`
        : "This package is already covered by one of your selected higher-tier packages.",
      buttonLabel: "Covered by package",
      isDisabled: true,
      isPositiveState: true,
    };
  }

  if (activeAvailabilityState === "exclusive_with_selected") {
    return {
      heading: "Choose one styling finish",
      message: mutuallyExclusiveSelectedOptionTitle
        ? `${mutuallyExclusiveSelectedOptionTitle} is already selected. Adding this option will replace it.`
        : "This styling option cannot be combined with another selected styling option.",
      buttonLabel: "Choose this instead",
      isDisabled: false,
      isPositiveState: false,
    };
  }

  if (activeAvailabilityState === "incompatible") {
    return {
      heading: "Not available for this model",
      message:
        "This option is not compatible with the Go-Pod model you have selected.",
      buttonLabel: "Not compatible",
      isDisabled: true,
      isPositiveState: false,
    };
  }

  return {
    heading: "Add this option to your configuration",
    message:
      "Use this option to include the item in your current Go-Pod configuration.",
    buttonLabel: "Add to configuration",
    isDisabled: false,
    isPositiveState: false,
  };
}
