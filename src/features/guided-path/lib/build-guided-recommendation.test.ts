import { describe, expect, it } from "vitest";

import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { guidedQuizFallback } from "@/features/guided-path/data/guided-quiz-fallback";
import { buildGuidedRecommendation } from "@/features/guided-path/lib/build-guided-recommendation";

describe("buildGuidedRecommendation", () => {
  it("returns the closest available model when Pioneer has the strongest score", () => {
    const answers = Object.fromEntries(
      guidedQuizFallback.questions.map((question) => {
        const pioneerHeavyAnswer = [...question.answers]
          .sort(
            (left, right) =>
              right.modelScores
                .filter((score) => score.modelSlug === "pioneer")
                .reduce((total, score) => total + score.score, 0) -
              left.modelScores
                .filter((score) => score.modelSlug === "pioneer")
                .reduce((total, score) => total + score.score, 0),
          )[0];

        return [question.slug, pioneerHeavyAnswer.slug];
      }),
    );

    const recommendation = buildGuidedRecommendation(
      guidedQuizFallback,
      demoCatalogue,
      answers,
    );

    expect(recommendation).not.toBeNull();
    expect(recommendation?.recommendedModel.slug).toBe("classic");
    expect(recommendation?.recommendedModel.recommendationEligible).toBe(true);
  });

  it("does not dead-end when unavailable models are the only scored models", () => {
    const answers = Object.fromEntries(
      guidedQuizFallback.questions.map((question) => [
        question.slug,
        question.answers[0].slug,
      ]),
    );

    expect(
      buildGuidedRecommendation(guidedQuizFallback, demoCatalogue, answers)
        ?.recommendedModel.slug,
    ).toBe("classic");
  });

  it("excludes a selectable model that is not recommendation eligible", () => {
    const answers = Object.fromEntries(
      guidedQuizFallback.questions.map((question) => [
        question.slug,
        question.answers[0].slug,
      ]),
    );
    const unavailableForRecommendations = {
      ...demoCatalogue.models[0],
      id: "model-hidden-from-recommendations",
      slug: "hidden-from-recommendations",
      name: "Hidden from recommendations",
      recommendationEligible: false,
      sortOrder: -1,
    };
    const quiz = {
      ...guidedQuizFallback,
      questions: guidedQuizFallback.questions.map((question) => ({
        ...question,
        answers: question.answers.map((answer) => ({
          ...answer,
          modelScores: [
            ...answer.modelScores,
            { modelSlug: unavailableForRecommendations.slug, score: 1000 },
          ],
        })),
      })),
    };

    expect(
      buildGuidedRecommendation(
        quiz,
        {
          ...demoCatalogue,
          models: [unavailableForRecommendations, ...demoCatalogue.models],
        },
        answers,
      )?.recommendedModel.slug,
    ).toBe("classic");
  });
});
