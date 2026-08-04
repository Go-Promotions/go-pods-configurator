import {
  findSelectedModel,
  flattenCatalogueOptions,
  getSelectedOptionIdsWithoutPackageDuplicates,
  isOptionCompatibleWithModel,
  isOptionIncludedWithModel,
  PACKAGE_CATEGORY_ID,
} from "@/features/configurator/lib/configurator-compatibility";
import { isModelRecommendationEligible } from "@/features/configurator/lib/model-availability";
import type { ConfiguratorCatalogue, ConfiguratorModel, ConfiguratorOption } from "@/types/configurator";
import type { GuidedQuizDefinition } from "@/types/guided-quiz";

export const GUIDED_CONFIGURATION_MODEL_SLUG = "classic";

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
  explanation: string[];
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

  const recommendedModel = getGuidedConfigurationModel(catalogue.models);

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
    explanation: buildRecommendationExplanation(
      quiz,
      selectedAnswerSlugs,
      suggestedOptions,
    ),
  };
}

export function getGuidedPackageOverlapNotice(
  suggestedOptions: ConfiguratorOption[],
  allOptions: ConfiguratorOption[],
  recommendedModel: ConfiguratorModel,
) {
  return getBestGuidedPackageOverlapNotice(
    suggestedOptions,
    allOptions,
    recommendedModel,
  );
}

function getGuidedConfigurationModel(models: ConfiguratorModel[]) {
  const classicModel = findSelectedModel(models, GUIDED_CONFIGURATION_MODEL_SLUG);

  return classicModel && isModelRecommendationEligible(classicModel)
    ? classicModel
    : null;
}

function getSuggestedOptions(
  catalogue: ConfiguratorCatalogue,
  recommendedModel: ConfiguratorModel,
  selectedAnswers: GuidedQuizDefinition["questions"][number]["answers"],
) {
  const allOptions = flattenCatalogueOptions(catalogue.optionCategories);
  const optionStrengthBySlug = new Map<string, number>();

  for (const answer of selectedAnswers) {
    for (const suggestion of answer.optionSuggestions) {
      optionStrengthBySlug.set(
        suggestion.optionSlug,
        (optionStrengthBySlug.get(suggestion.optionSlug) ?? 0) + suggestion.priority,
      );
    }
  }

  const rankedOptions = allOptions
    .filter((option) => optionStrengthBySlug.has(option.slug))
    .filter((option) => option.isActive)
    .filter((option) => isOptionCompatibleWithModel(option, recommendedModel.slug))
    .filter((option) => !isOptionIncludedWithModel(option, recommendedModel))
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

  const seenOptionSlugs = new Set<string>();
  const uniqueRankedOptions = rankedOptions.filter((option) => {
    if (seenOptionSlugs.has(option.slug)) {
      return false;
    }

    seenOptionSlugs.add(option.slug);
    return true;
  });
  const selectedOptionIds = [...uniqueRankedOptions]
    .reverse()
    .reduce<string[]>(
      (currentOptionIds, option) =>
        getSelectedOptionIdsWithoutPackageDuplicates(
          option.id,
          currentOptionIds,
          uniqueRankedOptions,
        ),
      [],
    );
  const selectedOptionIdSet = new Set(selectedOptionIds);

  return uniqueRankedOptions.filter((option) => selectedOptionIdSet.has(option.id));
}

function buildRecommendationExplanation(
  quiz: GuidedQuizDefinition,
  selectedAnswerSlugs: Record<string, string>,
  suggestedOptions: ConfiguratorOption[],
) {
  const tripQuestion = quiz.questions.find(
    (question) => question.slug === "trip-style",
  );
  const tripStyle = tripQuestion?.answers
    .find((answer) => answer.slug === selectedAnswerSlugs[tripQuestion.slug])
    ?.answerText.toLowerCase() ?? "your trips";
  const explanation = [
    `Based on your answers, we’ve tailored this Classic configuration for ${tripStyle}.`,
  ];

  if (suggestedOptions.length === 0) {
    explanation.push(
      "No optional upgrades were added automatically, so you can start with Classic and explore the catalogue yourself.",
    );
  } else {
    explanation.push(
      `Your recommended Classic setup includes ${suggestedOptions.length} compatible ${suggestedOptions.length === 1 ? "upgrade" : "upgrades"} shaped by your priorities.`,
    );
  }

  return explanation;
}

function getBestGuidedPackageOverlapNotice(
  suggestedOptions: ConfiguratorOption[],
  allOptions: ConfiguratorOption[],
  recommendedModel: ConfiguratorModel,
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
    .filter((option) => option.isActive)
    .filter((option) => isOptionCompatibleWithModel(option, recommendedModel.slug))
    .filter((option) => !isOptionIncludedWithModel(option, recommendedModel))
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
