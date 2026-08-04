import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { guidedQuizFallback } from "@/features/guided-path/data/guided-quiz-fallback";
import type {
  ConfiguratorCatalogue,
  ConfiguratorOption,
} from "@/types/configurator";

export const HISTORICAL_PIONEER_ANSWERS = {
  "who-is-staying": "more-than-two",
  "trip-style": "longer-stays",
  "comfort-convenience": "best-equipped",
  "manoeuvring-setup": "moving-alone",
  "what-matters-most": "bit-of-everything",
};

export function buildGuidedTestCatalogue(): ConfiguratorCatalogue {
  const optionSlugs = [
    ...new Set(
      guidedQuizFallback.questions.flatMap((question) =>
        question.answers.flatMap((answer) =>
          answer.optionSuggestions.map((suggestion) => suggestion.optionSlug),
        ),
      ),
    ),
  ];
  const optionTemplate = demoCatalogue.optionCategories[0].options[0];
  const options: ConfiguratorOption[] = optionSlugs.map((slug, index) => ({
    ...optionTemplate,
    id: `guided-option-${slug}`,
    title: slug
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" "),
    slug,
    sortOrder: index,
    appliesToAllModels: slug !== "110ah-battery",
    compatibleModelSlugs: slug === "110ah-battery" ? ["pioneer"] : [],
    includedModelSlugs: [],
  }));

  return {
    ...demoCatalogue,
    optionCategories: [
      {
        ...demoCatalogue.optionCategories[0],
        id: "guided-test-options",
        options: options.map((option) => ({
          ...option,
          categoryId: "guided-test-options",
        })),
      },
    ],
  };
}
