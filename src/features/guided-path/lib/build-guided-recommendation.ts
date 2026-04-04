import { PACKAGE_CATEGORY_ID } from "@/features/configurator/lib/configurator-compatibility";
import type { ConfiguratorCatalogue, ConfiguratorModel, ConfiguratorOption } from "@/types/configurator";
import type { GuidedQuizDefinition } from "@/types/guided-quiz";

const GUIDED_PACKAGE_OVERLAP_RULES = {
  "bronze-package": { tier: 1, minimumCoveredCount: 2 },
  "silver-package": { tier: 2, minimumCoveredCount: 2 },
  "gold-package": { tier: 3, minimumCoveredCount: 4 },
  "platinum-package": { tier: 4, minimumCoveredCount: 6 },
} as const;

export interface GuidedPackageOverlapNotice {
  packageOption: ConfiguratorOption;
  coveredCount: number;
  totalIncludedCount: number;
  coveredRatio: number;
  currentCostBasis: number;
  savings: number | null;
  contributingSelections: ConfiguratorOption[];
}

export interface GuidedRecommendation {
  recommendedModel: ConfiguratorModel;
  suggestedOptions: ConfiguratorOption[];
  packageOverlapNotice: GuidedPackageOverlapNotice | null;
}

type GuidedEligiblePackageOverlapNotice = GuidedPackageOverlapNotice & {
  tier: (typeof GUIDED_PACKAGE_OVERLAP_RULES)[keyof typeof GUIDED_PACKAGE_OVERLAP_RULES]["tier"];
};

export function buildGuidedRecommendation(
  quiz: GuidedQuizDefinition,
  catalogue: ConfiguratorCatalogue,
  selectedAnswerSlugs: Record<string, string>,
): GuidedRecommendation | null {
  const selectedAnswers = quiz.questions
    .map((question) =>
      question.answers.find((answer) => answer.slug === selectedAnswerSlugs[question.slug]),
    )
    .filter((answer): answer is NonNullable<typeof answer> => answer !== undefined);

  if (selectedAnswers.length !== quiz.questions.length) {
    return null;
  }

  const recommendedModel = getRecommendedModel(catalogue.models, selectedAnswers);

  if (!recommendedModel) {
    return null;
  }

  const suggestedOptions = getSuggestedOptions(
    catalogue,
    recommendedModel,
    selectedAnswers,
  );

  return {
    recommendedModel,
    suggestedOptions,
    packageOverlapNotice: getGuidedPackageOverlapNotice(
      suggestedOptions,
      catalogue.optionCategories.flatMap((category) => category.options),
    ),
  };
}

export function getGuidedPackageOverlapNotice(
  suggestedOptions: ConfiguratorOption[],
  allOptions: ConfiguratorOption[],
) {
  return getBestGuidedPackageOverlapNotice(suggestedOptions, allOptions);
}

function getRecommendedModel(
  models: ConfiguratorModel[],
  selectedAnswers: GuidedQuizDefinition["questions"][number]["answers"],
) {
  const scoreByModelSlug = new Map<string, number>();

  for (const answer of selectedAnswers) {
    for (const modelScore of answer.modelScores) {
      scoreByModelSlug.set(
        modelScore.modelSlug,
        (scoreByModelSlug.get(modelScore.modelSlug) ?? 0) + modelScore.score,
      );
    }
  }

  return [...models].sort((leftModel, rightModel) => {
    const leftScore = scoreByModelSlug.get(leftModel.slug) ?? 0;
    const rightScore = scoreByModelSlug.get(rightModel.slug) ?? 0;

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    if (leftModel.slug === "classic") {
      return -1;
    }

    if (rightModel.slug === "classic") {
      return 1;
    }

    return leftModel.sortOrder - rightModel.sortOrder;
  })[0] ?? null;
}

function getSuggestedOptions(
  catalogue: ConfiguratorCatalogue,
  recommendedModel: ConfiguratorModel,
  selectedAnswers: GuidedQuizDefinition["questions"][number]["answers"],
) {
  const allOptions = catalogue.optionCategories.flatMap((category) => category.options);
  const optionStrengthBySlug = new Map<string, number>();

  for (const answer of selectedAnswers) {
    for (const suggestion of answer.optionSuggestions) {
      optionStrengthBySlug.set(
        suggestion.optionSlug,
        (optionStrengthBySlug.get(suggestion.optionSlug) ?? 0) + suggestion.priority,
      );
    }
  }

  return [...allOptions]
    .filter((option) => optionStrengthBySlug.has(option.slug))
    .filter(
      (option) =>
        option.appliesToAllModels ||
        option.compatibleModelSlugs.includes(recommendedModel.slug),
    )
    .filter((option) => !option.includedModelSlugs.includes(recommendedModel.slug))
    .sort((leftOption, rightOption) => {
      const leftStrength = optionStrengthBySlug.get(leftOption.slug) ?? 0;
      const rightStrength = optionStrengthBySlug.get(rightOption.slug) ?? 0;

      if (leftStrength !== rightStrength) {
        return rightStrength - leftStrength;
      }

      if (leftOption.scope !== rightOption.scope) {
        return leftOption.scope.localeCompare(rightOption.scope);
      }

      return leftOption.sortOrder - rightOption.sortOrder;
    });
}

function getBestGuidedPackageOverlapNotice(
  suggestedOptions: ConfiguratorOption[],
  allOptions: ConfiguratorOption[],
) {
  const individuallySuggestedOptions = suggestedOptions.filter(
    (option) => option.categoryId !== PACKAGE_CATEGORY_ID,
  );
  const selectedOptionIds = new Set(suggestedOptions.map((option) => option.id));
  const suggestedOptionIds = new Set(
    individuallySuggestedOptions.map((option) => option.id),
  );

  const eligiblePackageNotices = allOptions
    .filter((option) => option.categoryId === PACKAGE_CATEGORY_ID)
    .map((packageOption) => {
      const rule =
        GUIDED_PACKAGE_OVERLAP_RULES[
          packageOption.slug as keyof typeof GUIDED_PACKAGE_OVERLAP_RULES
        ] ?? null;

      if (
        rule === null ||
        packageOption.includedOptionIds.length === 0 ||
        selectedOptionIds.has(packageOption.id)
      ) {
        return null;
      }

      const coveredCount = packageOption.includedOptionIds.filter((includedOptionId) =>
        suggestedOptionIds.has(includedOptionId),
      ).length;

      if (coveredCount < rule.minimumCoveredCount) {
        return null;
      }

      const contributingSelections = individuallySuggestedOptions.filter((option) =>
        packageOption.includedOptionIds.includes(option.id),
      );
      const currentCostBasis = contributingSelections.reduce(
        (total, option) => total + option.price,
        0,
      );

      return {
        packageOption,
        coveredCount,
        totalIncludedCount: packageOption.includedOptionIds.length,
        coveredRatio: coveredCount / packageOption.includedOptionIds.length,
        currentCostBasis,
        savings:
          currentCostBasis > packageOption.price
            ? currentCostBasis - packageOption.price
            : null,
        contributingSelections,
        tier: rule.tier,
      };
    })
    .filter(
      (notice): notice is GuidedEligiblePackageOverlapNotice => notice !== null,
    )
    .sort((leftNotice, rightNotice) => {
      if (leftNotice.tier !== rightNotice.tier) {
        return rightNotice.tier - leftNotice.tier;
      }

      if (leftNotice.coveredRatio !== rightNotice.coveredRatio) {
        return rightNotice.coveredRatio - leftNotice.coveredRatio;
      }

      return rightNotice.coveredCount - leftNotice.coveredCount;
    });

  return eligiblePackageNotices[0] ?? null;
}
