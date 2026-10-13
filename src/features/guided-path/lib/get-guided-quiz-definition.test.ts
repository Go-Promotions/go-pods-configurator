import { beforeEach, describe, expect, it, vi } from "vitest";

import { guidedQuizFallback } from "@/features/guided-path/data/guided-quiz-fallback";
import { getGuidedQuizDefinition } from "@/features/guided-path/lib/get-guided-quiz-definition";
import {
  getCatalogueRows,
  isConfiguratorPreview,
  type CatalogueRows,
} from "@/lib/configurator-api";

vi.mock("@/lib/configurator-api", () => ({
  getCatalogueRows: vi.fn(),
  isConfiguratorPreview: vi.fn(),
}));

const uuid = (number: number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const timestamps = {
  created_at: "2026-10-13T12:00:00.000Z",
  updated_at: "2026-10-13T12:00:00.000Z",
};

function catalogue(): CatalogueRows {
  return {
    models: [{
      ...timestamps, id: uuid(40), slug: "classic", name: "Classic",
      short_description: "Compact tourer", image_path: null, base_price: 14995,
      base_miro: 580, active: true, availability: "available", selectable: true,
      recommendation_eligible: true, sort_order: 1,
    }],
    options: [
      { ...timestamps, id: uuid(30), slug: "space-heater", title: "Space heater", active: true,
        applies_to_all_models: true, category_id: uuid(50), full_description: "Heating",
        price: 1395, primary_image_url: null, scope: "accessory", short_description: "Heating",
        sort_order: 1, weight: 5 },
      { ...timestamps, id: uuid(31), slug: "solar-panel", title: "Solar panel", active: true,
        applies_to_all_models: true, category_id: uuid(50), full_description: "Solar",
        price: 549, primary_image_url: null, scope: "accessory", short_description: "Solar",
        sort_order: 2, weight: 6 },
    ],
    model_specs: [], model_images: [], option_categories: [], option_images: [],
    option_model_compatibility: [], option_model_inclusions: [], option_package_inclusions: [],
    quiz_questions: [
      { ...timestamps, id: uuid(2), slug: "comfort", question_text: "How much comfort?", sort_order: 20, is_active: true },
      { ...timestamps, id: uuid(3), slug: "retired", question_text: "Old question", sort_order: 0, is_active: false },
      { ...timestamps, id: uuid(1), slug: "travellers", question_text: "Who is travelling?", sort_order: 10, is_active: true },
    ],
    quiz_answers: [
      { ...timestamps, id: uuid(12), question_id: uuid(1), slug: "family", answer_text: "The family", sort_order: 20 },
      { ...timestamps, id: uuid(13), question_id: uuid(2), slug: "extra-comfort", answer_text: "Extra comfort", sort_order: 10 },
      { ...timestamps, id: uuid(14), question_id: uuid(3), slug: "retired-answer", answer_text: "Old answer", sort_order: 0 },
      { ...timestamps, id: uuid(15), question_id: uuid(999), slug: "orphan-answer", answer_text: "Missing question", sort_order: 0 },
      { ...timestamps, id: uuid(11), question_id: uuid(1), slug: "two-adults", answer_text: "Two adults", sort_order: 10 },
    ],
    quiz_answer_option_suggestions: [
      { ...timestamps, id: uuid(60), answer_id: uuid(11), option_id: uuid(31), priority: 2, note: null },
      { ...timestamps, id: uuid(61), answer_id: uuid(13), option_id: uuid(30), priority: 5, note: "Warm evenings" },
      { ...timestamps, id: uuid(62), answer_id: uuid(11), option_id: uuid(999), priority: 100, note: "Deleted option" },
      { ...timestamps, id: uuid(63), answer_id: uuid(11), option_id: uuid(30), priority: 9, note: "For longer trips" },
      { ...timestamps, id: uuid(64), answer_id: uuid(999), option_id: uuid(31), priority: 99, note: "Missing answer" },
    ],
    quiz_answer_model_scores: [
      { ...timestamps, id: uuid(70), answer_id: uuid(11), model_id: uuid(999), score: 100 },
      { ...timestamps, id: uuid(71), answer_id: uuid(11), model_id: uuid(40), score: 7 },
      { ...timestamps, id: uuid(72), answer_id: uuid(13), model_id: uuid(40), score: -2 },
      { ...timestamps, id: uuid(73), answer_id: uuid(999), model_id: uuid(40), score: 99 },
    ],
  };
}

describe("getGuidedQuizDefinition", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isConfiguratorPreview).mockReturnValue(false);
  });

  it("returns the ordered live quiz with answer-specific option and model slugs", async () => {
    vi.mocked(getCatalogueRows).mockResolvedValue(catalogue());

    await expect(getGuidedQuizDefinition()).resolves.toEqual({
      questions: [
        {
          id: uuid(1), slug: "travellers", questionText: "Who is travelling?", sortOrder: 10, isActive: true,
          answers: [
            {
              id: uuid(11), slug: "two-adults", answerText: "Two adults", sortOrder: 10,
              optionSuggestions: [
                { optionSlug: "space-heater", priority: 9, note: "For longer trips" },
                { optionSlug: "solar-panel", priority: 2, note: null },
              ],
              modelScores: [{ modelSlug: "classic", score: 7 }],
            },
            {
              id: uuid(12), slug: "family", answerText: "The family", sortOrder: 20,
              optionSuggestions: [], modelScores: [],
            },
          ],
        },
        {
          id: uuid(2), slug: "comfort", questionText: "How much comfort?", sortOrder: 20, isActive: true,
          answers: [{
            id: uuid(13), slug: "extra-comfort", answerText: "Extra comfort", sortOrder: 10,
            optionSuggestions: [{ optionSlug: "space-heater", priority: 5, note: "Warm evenings" }],
            modelScores: [{ modelSlug: "classic", score: -2 }],
          }],
        },
      ],
    });
  });

  it("uses the demonstration quiz only in explicit preview mode", async () => {
    vi.mocked(isConfiguratorPreview).mockReturnValue(true);

    await expect(getGuidedQuizDefinition()).resolves.toEqual(guidedQuizFallback);
    expect(getCatalogueRows).not.toHaveBeenCalled();
  });

  it("propagates a live catalogue failure instead of showing demonstration questions", async () => {
    const unavailable = new Error("Catalogue unavailable");
    vi.mocked(getCatalogueRows).mockRejectedValue(unavailable);

    await expect(getGuidedQuizDefinition()).rejects.toBe(unavailable);
  });

  it("keeps an empty live quiz empty instead of substituting demonstration questions", async () => {
    const rows = catalogue();
    rows.quiz_questions = [];
    vi.mocked(getCatalogueRows).mockResolvedValue(rows);

    await expect(getGuidedQuizDefinition()).resolves.toEqual({ questions: [] });
  });
});
