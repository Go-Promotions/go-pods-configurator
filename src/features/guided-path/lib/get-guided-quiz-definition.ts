import { guidedQuizFallback } from "@/features/guided-path/data/guided-quiz-fallback";
import { hasPublicSupabaseEnv } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GuidedQuizDefinition } from "@/types/guided-quiz";
import type { Database } from "@/types/supabase";

export async function getGuidedQuizDefinition(): Promise<GuidedQuizDefinition> {
  if (!hasPublicSupabaseEnv()) {
    return guidedQuizFallback;
  }

  try {
    const supabase = createServerSupabaseClient();

    const [
      questionsResult,
      answersResult,
      optionSuggestionsResult,
      modelScoresResult,
      optionsResult,
      modelsResult,
    ] = await Promise.all([
      supabase
        .from("quiz_questions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("quiz_answers").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("quiz_answer_option_suggestions")
        .select("*")
        .order("priority", { ascending: false }),
      supabase.from("quiz_answer_model_scores").select("*"),
      supabase.from("options").select("id, slug"),
      supabase.from("models").select("id, slug"),
    ]);

    if (
      questionsResult.error ||
      answersResult.error ||
      optionSuggestionsResult.error ||
      modelScoresResult.error ||
      optionsResult.error ||
      modelsResult.error
    ) {
      return guidedQuizFallback;
    }

    const questionsRows =
      (questionsResult.data ??
        []) as Database["public"]["Tables"]["quiz_questions"]["Row"][];
    const answersRows =
      (answersResult.data ?? []) as Database["public"]["Tables"]["quiz_answers"]["Row"][];
    const optionSuggestionRows =
      (optionSuggestionsResult.data ??
        []) as Database["public"]["Tables"]["quiz_answer_option_suggestions"]["Row"][];
    const modelScoreRows =
      (modelScoresResult.data ??
        []) as Database["public"]["Tables"]["quiz_answer_model_scores"]["Row"][];
    const optionRows =
      (optionsResult.data ?? []) as Pick<
        Database["public"]["Tables"]["options"]["Row"],
        "id" | "slug"
      >[];
    const modelRows =
      (modelsResult.data ?? []) as Pick<
        Database["public"]["Tables"]["models"]["Row"],
        "id" | "slug"
      >[];

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
  } catch {
    return guidedQuizFallback;
  }
}
