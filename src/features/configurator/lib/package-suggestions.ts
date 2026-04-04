import type { ConfiguratorOption } from "@/types/configurator";
import { isPackageOption } from "@/features/configurator/lib/configurator-compatibility";

const PACKAGE_SUGGESTION_RULES = {
  "bronze-package": {
    tier: 1,
    minCoveredCount: 2,
    label: "Bronze Upgrade Package",
  },
  "silver-package": {
    tier: 2,
    minCoveredCount: 3,
    label: "Silver Upgrade Package",
  },
  "gold-package": {
    tier: 3,
    minCoveredCount: 6,
    label: "Gold Upgrade Package",
  },
  "platinum-package": {
    tier: 4,
    minCoveredCount: 8,
    label: "Platinum Upgrade Package",
  },
} as const;

type PackageSuggestionSlug = keyof typeof PACKAGE_SUGGESTION_RULES;

export interface PackageSuggestion {
  packageOption: ConfiguratorOption;
  coveredCount: number;
  totalIncludedCount: number;
  coveredRatio: number;
  savings: number | null;
  currentCostBasis: number;
  contributingSelections: ConfiguratorOption[];
}

interface RankedPackageSuggestion extends PackageSuggestion {
  tier: 1 | 2 | 3 | 4;
}

function getPackageSuggestionRule(slug: string) {
  return PACKAGE_SUGGESTION_RULES[slug as PackageSuggestionSlug] ?? null;
}

export function getEffectiveCoveredOptionIds(
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const optionMap = new Map(options.map((option) => [option.id, option]));
  const effectiveCoveredOptionIds = new Set<string>(selectedOptionIds);

  for (const selectedOptionId of selectedOptionIds) {
    const selectedOption = optionMap.get(selectedOptionId);

    if (!selectedOption) {
      continue;
    }

    for (const includedOptionId of selectedOption.includedOptionIds) {
      effectiveCoveredOptionIds.add(includedOptionId);
    }
  }

  return effectiveCoveredOptionIds;
}

function getHighestSelectedPackageTier(
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const optionMap = new Map(options.map((option) => [option.id, option]));
  let highestTier = 0;

  for (const selectedOptionId of selectedOptionIds) {
    const selectedOption = optionMap.get(selectedOptionId);

    if (!selectedOption) {
      continue;
    }

    const rule = getPackageSuggestionRule(selectedOption.slug);

    if (rule) {
      highestTier = Math.max(highestTier, rule.tier);
    }
  }

  return highestTier;
}

function getSelectionsContributingToPackageCoverage(
  packageOption: ConfiguratorOption,
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const optionMap = new Map(options.map((option) => [option.id, option]));
  const packageIncludedOptionIds = new Set(packageOption.includedOptionIds);

  return selectedOptionIds
    .map((selectedOptionId) => optionMap.get(selectedOptionId))
    .filter((option): option is ConfiguratorOption => option !== undefined)
    .filter((selectedOption) => {
      if (packageIncludedOptionIds.has(selectedOption.id)) {
        return true;
      }

      return selectedOption.includedOptionIds.some((includedOptionId) =>
        packageIncludedOptionIds.has(includedOptionId),
      );
    });
}

export function buildPackageSuggestion(
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const effectiveCoveredOptionIds = getEffectiveCoveredOptionIds(
    selectedOptionIds,
    options,
  );
  const highestSelectedPackageTier = getHighestSelectedPackageTier(
    selectedOptionIds,
    options,
  );

  const eligibleSuggestions = options
    .map((option) => {
      const rule = getPackageSuggestionRule(option.slug);

      if (
        rule === null ||
        selectedOptionIds.includes(option.id) ||
        rule.tier < highestSelectedPackageTier
      ) {
        return null;
      }

      const totalIncludedCount = option.includedOptionIds.length;

      if (totalIncludedCount === 0) {
        return null;
      }

      const coveredCount = option.includedOptionIds.filter((includedOptionId) =>
        effectiveCoveredOptionIds.has(includedOptionId),
      ).length;

      if (coveredCount < rule.minCoveredCount) {
        return null;
      }

      const contributingSelections = getSelectionsContributingToPackageCoverage(
        option,
        selectedOptionIds,
        options,
      );
      const currentCostBasis = contributingSelections.reduce(
        (total, selectedOption) => total + selectedOption.price,
        0,
      );

      return {
        packageOption: option,
        coveredCount,
        totalIncludedCount,
        coveredRatio: coveredCount / totalIncludedCount,
        savings:
          currentCostBasis > option.price ? currentCostBasis - option.price : null,
        currentCostBasis,
        contributingSelections,
        tier: rule.tier,
      };
    })
    .filter((suggestion): suggestion is RankedPackageSuggestion => suggestion !== null)
    .sort((leftSuggestion, rightSuggestion) => {
      if (leftSuggestion.tier !== rightSuggestion.tier) {
        return rightSuggestion.tier - leftSuggestion.tier;
      }

      if (leftSuggestion.coveredCount !== rightSuggestion.coveredCount) {
        return rightSuggestion.coveredCount - leftSuggestion.coveredCount;
      }

      return rightSuggestion.packageOption.price - leftSuggestion.packageOption.price;
    });

  return eligibleSuggestions[0] ?? null;
}

export function applySuggestedPackageSelection(
  packageOptionId: string,
  selectedOptionIds: string[],
  options: ConfiguratorOption[],
) {
  const optionMap = new Map(options.map((option) => [option.id, option]));
  const packageOption = optionMap.get(packageOptionId);

  if (!packageOption) {
    return selectedOptionIds;
  }

  const packageIncludedOptionIds = new Set(packageOption.includedOptionIds);

  const filteredSelectedOptionIds = selectedOptionIds.filter((selectedOptionId) => {
    const selectedOption = optionMap.get(selectedOptionId);

    if (!selectedOption) {
      return true;
    }

    if (isPackageOption(selectedOption)) {
      return false;
    }

    if (packageIncludedOptionIds.has(selectedOptionId)) {
      return false;
    }

    if (
      selectedOption.includedOptionIds.length > 0 &&
      selectedOption.includedOptionIds.every((includedOptionId) =>
        packageIncludedOptionIds.has(includedOptionId),
      )
    ) {
      return false;
    }

    return true;
  });

  if (filteredSelectedOptionIds.includes(packageOptionId)) {
    return filteredSelectedOptionIds;
  }

  return [...filteredSelectedOptionIds, packageOptionId];
}

export function getPackageSuggestionLabel(option: ConfiguratorOption) {
  return getPackageSuggestionRule(option.slug)?.label ?? option.title;
}
