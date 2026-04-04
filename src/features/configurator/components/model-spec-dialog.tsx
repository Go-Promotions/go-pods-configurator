"use client";

import { useId, useMemo, useState, type MouseEvent } from "react";

import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import { DEFAULT_MTPLM_KG } from "@/features/configurator/lib/vehicle-constants";
import type { ConfiguratorModel } from "@/types/configurator";

interface ModelSpecDialogProps {
  model: ConfiguratorModel;
}

interface ModelGalleryImage {
  id: string;
  imagePath: string;
  altText: string;
}

function getSpecIcon(sectionLabel: string) {
  const normalizedLabel = sectionLabel.toLowerCase();

  if (normalizedLabel.includes("sleep")) {
    return "◐";
  }

  if (normalizedLabel.includes("dimension")) {
    return "□";
  }

  if (normalizedLabel.includes("kitchen")) {
    return "⌂";
  }

  if (normalizedLabel.includes("comfort")) {
    return "✦";
  }

  return "•";
}

function buildModelGalleryImages(model: ConfiguratorModel): ModelGalleryImage[] {
  const galleryImages: ModelGalleryImage[] = [];
  const seenPaths = new Set<string>();

  function pushImage(image: ModelGalleryImage) {
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

  if (model.imagePath) {
    pushImage({
      id: `${model.id}-primary-image`,
      imagePath: model.imagePath,
      altText: model.name,
    });
  }

  for (const image of [...model.images].sort(
    (leftImage, rightImage) => leftImage.sortOrder - rightImage.sortOrder,
  )) {
    pushImage({
      id: image.id,
      imagePath: image.imagePath,
      altText: image.altText || model.name,
    });
  }

  return galleryImages;
}

interface ModelGalleryImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

function ModelGalleryImage({
  src,
  alt,
  className = "h-full w-full object-contain p-5",
}: ModelGalleryImageProps) {
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

interface SpecFeatureIconProps {
  iconPath: string | null;
  fallbackSymbol: string;
  altText: string;
}

function SpecFeatureIcon({
  iconPath,
  fallbackSymbol,
  altText,
}: SpecFeatureIconProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const resolvedIconPath = iconPath?.trim() || null;

  if (resolvedIconPath === null || hasImageError) {
    return (
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
        {fallbackSymbol}
      </span>
    );
  }

  return (
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent-soft)] p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedIconPath}
        alt={altText}
        className="h-full w-full object-contain"
        onError={() => setHasImageError(true)}
      />
    </span>
  );
}

export function ModelSpecDialog({ model }: ModelSpecDialogProps) {
  const dialogId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const galleryImages = useMemo(() => buildModelGalleryImages(model), [model]);
  const [activeImagePath, setActiveImagePath] = useState<string | null>(
    galleryImages[0]?.imagePath ?? null,
  );
  const dimensionSpecs = model.specs.filter(
    (spec) => spec.sectionLabel.trim().toLowerCase() === "dimensions",
  );
  const featureSpecs = model.specs.filter(
    (spec) => spec.sectionLabel.trim().toLowerCase() !== "dimensions",
  );
  const activeImage =
    galleryImages.find((image) => image.imagePath === activeImagePath) ??
    galleryImages[0] ??
    null;

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  }

  function handleOpen() {
    const nextImages = buildModelGalleryImages(model);
    setActiveImagePath(nextImages[0]?.imagePath ?? null);
    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        aria-haspopup="dialog"
        aria-controls={dialogId}
      >
        View standard specification
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,36,48,0.55)] p-4"
          onClick={handleBackdropClick}
        >
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:p-8"
          >
            <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Standard specification
                </p>
                <h3
                  id={`${dialogId}-title`}
                  className="text-2xl font-semibold tracking-tight"
                >
                  {model.name}
                </h3>
                <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
                  {model.shortDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-[var(--color-surface)] sm:aspect-[4/3]">
                <ModelGalleryImage
                  src={activeImage?.imagePath ?? null}
                  alt={activeImage?.altText ?? model.name}
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
                        aria-label={`View image ${galleryImages.indexOf(image) + 1} for ${model.name}`}
                        aria-pressed={isActive}
                      >
                        <div className="aspect-square">
                          <ModelGalleryImage
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

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Base price
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  {formatPrice(model.basePrice)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Base MiRO
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  {formatWeightKg(model.baseMiro)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  MTPLM
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  {formatWeightKg(DEFAULT_MTPLM_KG)}
                </p>
              </div>
              {dimensionSpecs.length > 0 ? (
                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    Dimensions
                  </p>
                  <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                    {dimensionSpecs.map((spec) => (
                      <div
                        key={spec.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                          {spec.itemLabel}
                        </p>
                        <p className="mt-3 text-base font-semibold text-[var(--color-foreground)]">
                          {spec.itemValue}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {featureSpecs.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Included as standard
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {featureSpecs.map((spec) => (
                    <div
                      key={spec.id}
                      className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                    >
                      <div className="flex h-full flex-col gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                          {spec.sectionLabel}
                        </p>
                        <SpecFeatureIcon
                          iconPath={spec.iconPath}
                          fallbackSymbol={getSpecIcon(spec.sectionLabel)}
                          altText={`${spec.itemLabel} icon`}
                        />
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {spec.itemLabel}
                        </p>
                        <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
                          {spec.itemValue}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
