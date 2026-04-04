import type {
  ConfiguratorModel,
  ConfiguratorOption,
  OptionCategory,
} from "@/types/configurator";

export const PACKAGE_CATEGORY_ID = "c9ed18ab-c04b-4667-b642-e3ae914913fa";

export function isPackageOption(option: ConfiguratorOption) {
  return option.categoryId === PACKAGE_CATEGORY_ID;
}

export function isOptionCompatibleWithModel(
  option: ConfiguratorOption,
  modelSlug: string | null,
) {
  if (modelSlug === null) {
    return false;
  }

  if (option.appliesToAllModels) {
    return true;
  }

  return option.compatibleModelSlugs.includes(modelSlug);
}

export function isOptionIncludedWithModel(
  option: ConfiguratorOption,
  model: ConfiguratorModel | null,
) {
  if (model === null) {
    return false;
  }

  return option.includedModelSlugs.includes(model.slug);
}

export function getOptionsById(options: ConfiguratorOption[]) {
  return new Map(options.map((option) => [option.id, option]));
}

export function getSelectedPackageCoveringOptions(
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const optionMap = getOptionsById(options);
  const packageCoveringOptionIds = new Set<string>();

  for (const selectedOptionId of selectedOptionIds) {
    const selectedOption = optionMap.get(selectedOptionId);

    if (!selectedOption) {
      continue;
    }

    for (const includedOptionId of selectedOption.includedOptionIds) {
      packageCoveringOptionIds.add(includedOptionId);
    }
  }

  return packageCoveringOptionIds;
}

export function getSelectedPackageOptions(
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const optionMap = getOptionsById(options);

  return selectedOptionIds
    .map((selectedOptionId) => optionMap.get(selectedOptionId))
    .filter(
      (option): option is ConfiguratorOption =>
        option !== undefined && isPackageOption(option),
    );
}

export function getSelectedPackageTitlesCoveringOption(
  optionId: string,
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  return getSelectedPackageOptions(selectedOptionIds, options)
    .filter((option) => option.includedOptionIds.includes(optionId))
    .map((option) => option.title);
}

export function getSelectedHigherTierPackageTitlesCoveringPackage(
  packageOption: ConfiguratorOption,
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const packageIncludedOptionIds = new Set(packageOption.includedOptionIds);

  if (!isPackageOption(packageOption) || packageIncludedOptionIds.size === 0) {
    return [];
  }

  return getSelectedPackageOptions(selectedOptionIds, options)
    .filter((selectedPackage) => selectedPackage.id !== packageOption.id)
    .filter(
      (selectedPackage) =>
        selectedPackage.includedOptionIds.length > 0 &&
        packageOption.includedOptionIds.every((includedOptionId) =>
          selectedPackage.includedOptionIds.includes(includedOptionId),
        ),
    )
    .map((selectedPackage) => selectedPackage.title);
}

export function getOptionAvailabilityState(
  option: ConfiguratorOption,
  model: ConfiguratorModel | null,
  selectedOptionIds: string[] = [],
  options: ConfiguratorOption[] = [],
) {
  if (model === null) {
    return "requires_model" as const;
  }

  if (isOptionIncludedWithModel(option, model)) {
    return "included" as const;
  }

  const coveringHigherTierPackageTitles = getSelectedHigherTierPackageTitlesCoveringPackage(
    option,
    selectedOptionIds,
    options,
  );

  if (
    coveringHigherTierPackageTitles.length > 0 &&
    !selectedOptionIds.includes(option.id)
  ) {
    return "covered_by_selected_package" as const;
  }

  const coveringPackageTitles = getSelectedPackageTitlesCoveringOption(
    option.id,
    selectedOptionIds,
    options,
  );

  if (coveringPackageTitles.length > 0 && !selectedOptionIds.includes(option.id)) {
    return "included_in_package" as const;
  }

  if (isOptionCompatibleWithModel(option, model.slug)) {
    return "available" as const;
  }

  return "incompatible" as const;
}

export function filterCompatibleSelectedOptionIds(
  optionIds: string[],
  options: ConfiguratorOption[],
  modelSlug: string | null,
) {
  return optionIds.filter((optionId) => {
    const option = options.find((candidate) => candidate.id === optionId);

    return option ? isOptionCompatibleWithModel(option, modelSlug) : false;
  });
}

export function getSelectedOptionIdsWithoutPackageDuplicates(
  nextOptionId: string,
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const nextOption = options.find((option) => option.id === nextOptionId);

  if (!nextOption) {
    return [...selectedOptionIds, nextOptionId];
  }

  if (isPackageOption(nextOption)) {
    const nextPackageIncludedOptionIds = new Set(nextOption.includedOptionIds);

    const nextSelectedOptionIds = selectedOptionIds.filter((selectedOptionId) => {
      const selectedOption = options.find((option) => option.id === selectedOptionId);

      if (!selectedOption) {
        return true;
      }

      if (isPackageOption(selectedOption)) {
        return false;
      }

      return !nextPackageIncludedOptionIds.has(selectedOptionId);
    });

    return [...nextSelectedOptionIds, nextOptionId];
  }

  const nextSelectedOptionIds = selectedOptionIds.filter(
    (selectedOptionId) => !nextOption.includedOptionIds.includes(selectedOptionId),
  );

  return [...nextSelectedOptionIds, nextOptionId];
}

export function flattenCatalogueOptions(categories: OptionCategory[]) {
  return categories.flatMap((category) => category.options);
}

export function findSelectedModel(
  models: ConfiguratorModel[],
  selectedModelSlug: string | null,
) {
  return models.find((model) => model.slug === selectedModelSlug) ?? null;
}
