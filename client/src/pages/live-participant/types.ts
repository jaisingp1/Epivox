export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
  isCorrect?: boolean;
}

export interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  chart_type?: string;
  time_limit: number;
  options_json: string;
  correct_answer_value?: string;
  explanation_text?: string;
}

export interface ParticipantData {
  id: number;
  nickname: string;
  score: number;
}

export interface LastFeedbackData {
  isCorrect: boolean;
  isPoll?: boolean;
  pointsAwarded: number;
  newStreak: number;
  explanationText?: string;
  correctAnswerValue?: string;
}

export function getCorrectAnswerDisplay(q: QuestionData | null): string | null {
  if (!q) return null;
  try {
    const options: QuestionOption[] = JSON.parse(q.options_json || "[]");

    // 1. Buscar en opciones marcadas como correctas
    const markedCorrect = options.find((opt) =>
      Boolean(opt.is_correct ?? opt.isCorrect),
    );
    if (markedCorrect && markedCorrect.text) {
      return markedCorrect.text;
    }

    // 2. Buscar si coincide con correct_answer_value
    if (q.correct_answer_value) {
      const val = q.correct_answer_value.trim().toLowerCase();
      const match = options.find(
        (opt) =>
          (opt.id && opt.id.toLowerCase() === val) ||
          (opt.text && opt.text.toLowerCase() === val),
      );
      if (match) return match.text;

      // Casos Verdadero / Falso
      if (q.question_type === "true_false") {
        if (
          val === "true" ||
          val === "verdadero" ||
          val === "opt_t" ||
          val === "a"
        )
          return "Verdadero";
        if (
          val === "false" ||
          val === "falso" ||
          val === "opt_f" ||
          val === "b"
        )
          return "Falso";
      }

      return q.correct_answer_value;
    }

    // Caso Verdadero/Falso con opción id 'true' / 'false'
    if (q.question_type === "true_false") {
      const tOpt = options.find((o) => o.id === "true" || o.id === "A");
      if (tOpt?.is_correct || tOpt?.isCorrect) return "Verdadero";
      const fOpt = options.find((o) => o.id === "false" || o.id === "B");
      if (fOpt?.is_correct || fOpt?.isCorrect) return "Falso";
    }

    return null;
  } catch {
    return q.correct_answer_value || null;
  }
}

export function getSelectedAnswerDisplay(
  selectedId: string | null,
  q: QuestionData | null,
): string | null {
  if (!selectedId || !q) return null;
  if (q.question_type === "ranking") return selectedId;
  try {
    const options: QuestionOption[] = JSON.parse(q.options_json || "[]");
    const found = options.find(
      (opt) => opt.id.toLowerCase() === selectedId.toLowerCase(),
    );
    if (found) return found.text;

    if (q.question_type === "true_false") {
      const clean = selectedId.toLowerCase();
      if (clean === "true" || clean === "a" || clean === "opt_t")
        return "Verdadero";
      if (clean === "false" || clean === "b" || clean === "opt_f")
        return "Falso";
    }

    return selectedId;
  } catch {
    return selectedId;
  }
}
