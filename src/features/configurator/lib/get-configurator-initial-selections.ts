import {
  filterCompatibleSelectedOptionIds,
  flattenCatalogueOptions,
  getSelectedOptionIdsWithoutPackageDuplicates,
  isOptionIncludedWithModel,
} from "@/features/configurator/lib/configurator-compatibility";
import { configuratorSteps } from "@/features/configurator/lib/configurator-steps";
import type {
  ConfiguratorCatalogue,
  ConfiguratorInitialSelections,
  ConfiguratorStep,
} from "@/types/configurator";

interface ConfiguratorPageSearchParams {
  [key: string]: string | string[] | undefined;
}

export function getConfiguratorInitialSelections(
  searchParams: ConfiguratorPageSearchParams,
  catalogue: ConfiguratorCatalogue,
): ConfiguratorInitialSelections | null {
  const selectedModelSlug = getSingleSearchParam(searchParams.model);

  if (selectedModelSlug === null) {
    return null;
  }

  const selectedModel =
    catalogue.models.find((model) => model.slug === selectedModelSlug) ?? null;

  if (selectedModel === null) {
    return null;
  }

  const allOptions = flattenCatalogueOptions(catalogue.optionCategories);
  const requestedOptionSlugs = getMultiSearchParam(searchParams.options);

  let selectedOptionIds = requestedOptionSlugs
    .map((optionSlug) => allOptions.find((option) => option.slug === optionSlug))
    .filter((option): option is (typeof allOptions)[number] => option !== undefined)
    .filter((option) => !isOptionIncludedWithModel(option, selectedModel))
    .map((option) => option.id);

  selectedOptionIds = filterCompatibleSelectedOptionIds(
    selectedOptionIds,
    allOptions,
    selectedModel.slug,
  );

  const deduplicatedSelectedOptionIds: string[] = [];

  for (const optionId of selectedOptionIds) {
    if (deduplicatedSelectedOptionIds.includes(optionId)) {
      continue;
    }

    const nextSelectedOptionIds = getSelectedOptionIdsWithoutPackageDuplicates(
      optionId,
      deduplicatedSelectedOptionIds,
      allOptions,
    );

    deduplicatedSelectedOptionIds.splice(
      0,
      deduplicatedSelectedOptionIds.length,
      ...nextSelectedOptionIds,
    );
  }

  const requestedStep = getSingleSearchParam(searchParams.step);
  const currentStep = isConfiguratorStep(requestedStep)
    ? requestedStep
    : deduplicatedSelectedOptionIds.length > 0
      ? "accessories"
      : "model";

  return {
    currentStep,
    selectedModelSlug: selectedModel.slug,
    selectedOptionIds: deduplicatedSelectedOptionIds,
  };
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value?.trim() ? value : null;
}

function getMultiSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      entry
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    );
  }

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isConfiguratorStep(value: string | null): value is ConfiguratorStep {
  return configuratorSteps.some((step) => step.id === value);
}
