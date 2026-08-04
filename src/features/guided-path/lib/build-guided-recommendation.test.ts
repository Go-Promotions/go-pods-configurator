import { describe, expect, it } from "vitest";

import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import {
  getSelectedMutuallyExclusiveOption,
  isOptionCompatibleWithModel,
} from "@/features/configurator/lib/configurator-compatibility";
import { guidedQuizFallback } from "@/features/guided-path/data/guided-quiz-fallback";
import { buildGuidedRecommendation } from "@/features/guided-path/lib/build-guided-recommendation";
import {
  buildGuidedTestCatalogue,
  HISTORICAL_PIONEER_ANSWERS,
} from "@/features/guided-path/test/guided-test-fixtures";

describe("buildGuidedRecommendation", () => {
  it("builds a Classic configuration directly for a historical Pioneer winner", () => {
    const recommendation = buildGuidedRecommendation(
      guidedQuizFallback,
      buildGuidedTestCatalogue(),
      HISTORICAL_PIONEER_ANSWERS,
    );

    expect(getHistoricalModelWinner(HISTORICAL_PIONEER_ANSWERS)).toBe("pioneer");
    expect(recommendation).not.toBeNull();
    expect(recommendation?.recommendedModel.slug).toBe("classic");
    expect(recommendation?.explanation.length).toBeGreaterThan(0);
  });

  it("uses Classic even when another eligible model has the strongest score", () => {
    const challenger = {
      ...demoCatalogue.models[0],
      id: "model-challenger",
      slug: "challenger",
      name: "Challenger",
      sortOrder: 0,
    };
    const quiz = {
      ...guidedQuizFallback,
      questions: guidedQuizFallback.questions.map((question) => ({
        ...question,
        answers: question.answers.map((answer) => ({
          ...answer,
          modelScores: [
            ...answer.modelScores,
            { modelSlug: challenger.slug, score: 1000 },
          ],
        })),
      })),
    };

    expect(
      buildGuidedRecommendation(
        quiz,
        {
          ...buildGuidedTestCatalogue(),
          models: [challenger, ...demoCatalogue.models],
        },
        HISTORICAL_PIONEER_ANSWERS,
      )?.recommendedModel.slug,
    ).toBe("classic");
  });

  it("returns a valid Classic recommendation when no optional accessories match", () => {
    const recommendation = buildGuidedRecommendation(
      guidedQuizFallback,
      { ...demoCatalogue, optionCategories: [] },
      HISTORICAL_PIONEER_ANSWERS,
    );

    expect(recommendation).toMatchObject({
      recommendedModel: { slug: "classic" },
      suggestedOptions: [],
    });
  });

  it("returns null only when the fixed Classic model cannot be resolved", () => {
    expect(
      buildGuidedRecommendation(
        guidedQuizFallback,
        {
          ...buildGuidedTestCatalogue(),
          models: demoCatalogue.models.filter((model) => model.slug !== "classic"),
        },
        HISTORICAL_PIONEER_ANSWERS,
      ),
    ).toBeNull();
  });

  it("excludes inactive, incompatible, included, duplicate, and mutually exclusive options", () => {
    const catalogue = buildGuidedTestCatalogue();
    const baseOption = catalogue.optionCategories[0].options[0];
    const optionCategories = [
      {
        ...catalogue.optionCategories[0],
        options: [
          ...catalogue.optionCategories[0].options,
          { ...baseOption, id: "duplicate-solar", slug: "100w-solar" },
          { ...baseOption, id: "inactive-option", slug: "inactive-option", isActive: false },
          {
            ...baseOption,
            id: "pioneer-only-option",
            slug: "pioneer-only-option",
            appliesToAllModels: false,
            compatibleModelSlugs: ["pioneer"],
          },
          {
            ...baseOption,
            id: "included-option",
            slug: "included-option",
            includedModelSlugs: ["classic"],
          },
        ],
      },
    ];
    const quiz = addSuggestionsToEveryAnswer([
      "inactive-option",
      "pioneer-only-option",
      "included-option",
    ]);
    const recommendation = buildGuidedRecommendation(
      quiz,
      { ...catalogue, optionCategories },
      HISTORICAL_PIONEER_ANSWERS,
    );
    const optionSlugs = recommendation?.suggestedOptions.map((option) => option.slug) ?? [];

    expect(optionSlugs).not.toContain("inactive-option");
    expect(optionSlugs).not.toContain("pioneer-only-option");
    expect(optionSlugs).not.toContain("included-option");
    expect(optionSlugs.filter((slug) => slug === "100w-solar")).toHaveLength(1);
    expect(optionSlugs).not.toEqual(
      expect.arrayContaining(["custom-decals", "block-side-panels"]),
    );
  });

  it("returns a safe Classic configuration for all 1,024 valid answer combinations", () => {
    const catalogue = buildGuidedTestCatalogue();
    const combinations = getAllAnswerCombinations();
    const historicalPioneerWinners = combinations.filter(
      (answers) => getHistoricalModelWinner(answers) === "pioneer",
    );

    expect(combinations).toHaveLength(1024);
    expect(historicalPioneerWinners).toHaveLength(576);

    for (const answers of combinations) {
      const recommendation = buildGuidedRecommendation(
        guidedQuizFallback,
        catalogue,
        answers,
      );

      expect(recommendation, JSON.stringify(answers)).not.toBeNull();
      expect(recommendation?.recommendedModel.slug).toBe("classic");

      const optionIds = recommendation?.suggestedOptions.map((option) => option.id) ?? [];
      expect(new Set(optionIds).size).toBe(optionIds.length);

      for (const option of recommendation?.suggestedOptions ?? []) {
        expect(option.isActive).toBe(true);
        expect(isOptionCompatibleWithModel(option, "classic")).toBe(true);
        expect(
          getSelectedMutuallyExclusiveOption(
            option,
            optionIds.filter((optionId) => optionId !== option.id),
            catalogue.optionCategories.flatMap((category) => category.options),
          ),
        ).toBeNull();
      }
    }
  });
});

function getAllAnswerCombinations() {
  return guidedQuizFallback.questions.reduce<Array<Record<string, string>>>(
    (combinations, question) =>
      combinations.flatMap((combination) =>
        question.answers.map((answer) => ({
          ...combination,
          [question.slug]: answer.slug,
        })),
      ),
    [{}],
  );
}

function getHistoricalModelWinner(selectedAnswerSlugs: Record<string, string>) {
  const scores = new Map<string, number>();

  for (const question of guidedQuizFallback.questions) {
    const answer = question.answers.find(
      (candidate) => candidate.slug === selectedAnswerSlugs[question.slug],
    );

    for (const modelScore of answer?.modelScores ?? []) {
      scores.set(
        modelScore.modelSlug,
        (scores.get(modelScore.modelSlug) ?? 0) + modelScore.score,
      );
    }
  }

  return (scores.get("pioneer") ?? 0) > (scores.get("classic") ?? 0)
    ? "pioneer"
    : "classic";
}

function addSuggestionsToEveryAnswer(optionSlugs: string[]) {
  return {
    ...guidedQuizFallback,
    questions: guidedQuizFallback.questions.map((question) => ({
      ...question,
      answers: question.answers.map((answer) => ({
        ...answer,
        optionSuggestions: [
          ...answer.optionSuggestions,
          ...optionSlugs.map((optionSlug) => ({
            optionSlug,
            priority: 10,
            note: null,
          })),
        ],
      })),
    })),
  };
}
