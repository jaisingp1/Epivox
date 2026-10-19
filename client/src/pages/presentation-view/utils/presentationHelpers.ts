import type { QuestionData, QuestionOption } from "../types";

export const isOptionCorrect = (
  opt: QuestionOption,
  currentQ?: QuestionData,
): boolean => {
  if (opt.isCorrect !== undefined) return Boolean(opt.isCorrect);
  if (opt.is_correct !== undefined) return Boolean(opt.is_correct);
  if (currentQ?.correct_answer_value) {
    const target = currentQ.correct_answer_value
      .toString()
      .trim()
      .toLowerCase();
    const optId = (opt.id || "").toString().trim().toLowerCase();
    const optText = (opt.text || "").toString().trim().toLowerCase();
    if (optId === target || optText === target) return true;
    if (
      target === "true" &&
      (optId === "true" || optText.includes("verdadero"))
    )
      return true;
    if (target === "false" && (optId === "false" || optText.includes("falso")))
      return true;
  }
  return false;
};

export const checkIsItemCorrect = (
  item:
    | {
        id?: string;
        text?: string;
        isCorrect?: boolean;
        is_correct?: boolean;
      }
    | string,
  currentQ?: QuestionData,
): boolean => {
  if (typeof item === "string") {
    if (!currentQ?.correct_answer_value) return false;
    const target = currentQ.correct_answer_value
      .toString()
      .trim()
      .toLowerCase();
    const val = item.toString().trim().toLowerCase();
    if (target === val) return true;
    if (target === "true" && (val === "true" || val.includes("verdadero")))
      return true;
    if (target === "false" && (val === "false" || val.includes("falso")))
      return true;
    return false;
  }
  return isOptionCorrect(item as QuestionOption, currentQ);
};

export const getOptionVotes = (
  opt: QuestionOption,
  results: Record<string, number>,
): number => {
  if (!results || Object.keys(results).length === 0) return 0;

  const optIdLower = (opt.id || "").toString().trim().toLowerCase();
  const optTextLower = (opt.text || "").toString().trim().toLowerCase();

  let total = 0;
  let matched = false;

  for (const [k, v] of Object.entries(results)) {
    const kLower = k.toString().trim().toLowerCase();

    // Coincidencia exacta o en minúsculas por ID
    if (kLower === optIdLower) {
      total += Number(v) || 0;
      matched = true;
      continue;
    }

    // Coincidencia por texto de la opción
    if (optTextLower && kLower === optTextLower) {
      total += Number(v) || 0;
      matched = true;
      continue;
    }

    // Mapeo especial Verdadero / Falso
    if (optIdLower === "true" || optTextLower.includes("verdadero")) {
      if (
        kLower === "true" ||
        kLower === "opt_t" ||
        kLower.includes("verdadero")
      ) {
        total += Number(v) || 0;
        matched = true;
        continue;
      }
    }
    if (optIdLower === "false" || optTextLower.includes("falso")) {
      if (
        kLower === "false" ||
        kLower === "opt_f" ||
        kLower.includes("falso")
      ) {
        total += Number(v) || 0;
        matched = true;
        continue;
      }
    }
  }

  if (matched) return total;
  return results[opt.id] !== undefined ? Number(results[opt.id]) : 0;
};
