export interface GuidedQuizAnswerOptionSuggestion {
  optionSlug: string;
  priority: number;
  note: string | null;
}

export interface GuidedQuizAnswerModelScore {
  modelSlug: string;
  score: number;
}

export interface GuidedQuizAnswer {
  id: string;
  slug: string;
  answerText: string;
  sortOrder: number;
  optionSuggestions: GuidedQuizAnswerOptionSuggestion[];
  modelScores: GuidedQuizAnswerModelScore[];
}

export interface GuidedQuizQuestion {
  id: string;
  slug: string;
  questionText: string;
  sortOrder: number;
  isActive: boolean;
  answers: GuidedQuizAnswer[];
}

export interface GuidedQuizDefinition {
  questions: GuidedQuizQuestion[];
}
