import { guidedQuizFallback } from "@/features/guided-path/data/guided-quiz-fallback";
import { getCatalogueRows, isConfiguratorPreview } from "@/lib/configurator-api";
import type { GuidedQuizDefinition } from "@/types/guided-quiz";

export async function getGuidedQuizDefinition(): Promise<GuidedQuizDefinition> {
  if (isConfiguratorPreview()) {
    return guidedQuizFallback;
  }

  const rows = await getCatalogueRows();
  const questionsRows = rows.quiz_questions.filter(row => row.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const answersRows = [...rows.quiz_answers].sort((a, b) => a.sort_order - b.sort_order);
  const optionSuggestionRows = [...rows.quiz_answer_option_suggestions].sort((a, b) => b.priority - a.priority);
  const modelScoreRows = rows.quiz_answer_model_scores;
  const optionRows = rows.options;
  const modelRows = rows.models;

  return {
    questions: questionsRows.map((question) => ({
      id: question.id,
      slug: question.slug,
      questionText: question.question_text,
      sortOrder: question.sort_order,
      isActive: question.is_active,
      answers: answersRows
        .filter((answer) => answer.question_id === question.id)
        .map((answer) => ({
          id: answer.id,
          slug: answer.slug,
          answerText: answer.answer_text,
          sortOrder: answer.sort_order,
          optionSuggestions: optionSuggestionRows
            .filter((suggestion) => suggestion.answer_id === answer.id)
            .map((suggestion) => ({
              optionSlug:
                optionRows.find((option) => option.id === suggestion.option_id)?.slug ??
                "",
              priority: suggestion.priority,
              note: suggestion.note,
            }))
            .filter((suggestion) => suggestion.optionSlug.length > 0),
          modelScores: modelScoreRows
            .filter((score) => score.answer_id === answer.id)
            .map((score) => ({
              modelSlug:
                modelRows.find((model) => model.id === score.model_id)?.slug ?? "",
              score: score.score,
            }))
            .filter((score) => score.modelSlug.length > 0),
        })),
    })),
  };
}
