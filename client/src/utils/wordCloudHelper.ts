/**
 * Utilidades para la generación y renderizado de la Nube de Palabras (Word Cloud)
 * Epivox - Epiroc Platform
 */

export interface WordCloudItem {
  word: string;
  count: number;
  isCorrect?: boolean;
}

/**
 * Catálogo completo de Stop Words en Español e Inglés (artículos, preposiciones,
 * conjunciones, pronombres, adverbios vacíos y formas verbales auxiliares comunes).
 */
export const STOP_WORDS = new Set<string>([
  // Artículos determinados e indeterminados
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "lo",
  "al",
  "del",

  // Preposiciones (Español)
  "a",
  "ante",
  "bajo",
  "cabe",
  "con",
  "contra",
  "de",
  "desde",
  "durante",
  "en",
  "entre",
  "hacia",
  "hasta",
  "mediante",
  "para",
  "por",
  "segun",
  "según",
  "sin",
  "so",
  "sobre",
  "tras",
  "versus",
  "via",
  "vía",

  // Conjunciones (Español)
  "y",
  "e",
  "ni",
  "que",
  "o",
  "u",
  "pero",
  "sino",
  "aunque",
  "porque",
  "porqué",
  "pues",
  "ya",
  "si",
  "como",
  "tanto",
  "cuando",
  "donde",
  "mientras",
  "siquiera",

  // Pronombres personales y demostrativos
  "yo",
  "tu",
  "tú",
  "el",
  "él",
  "ella",
  "ello",
  "nosotros",
  "nosotras",
  "vosotros",
  "vosotras",
  "ellos",
  "ellas",
  "me",
  "te",
  "se",
  "nos",
  "os",
  "le",
  "les",
  "mi",
  "mí",
  "ti",
  "si",
  "sí",
  "conmigo",
  "contigo",
  "consigo",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "esa",
  "esos",
  "esas",
  "aquel",
  "aquella",
  "aquellos",
  "aquellas",
  "esto",
  "eso",
  "aquello",
  "mio",
  "mío",
  "mia",
  "mía",
  "suyo",
  "suya",
  "tuyo",
  "tuya",
  "mis",
  "tus",
  "sus",
  "su",
  "nuestro",
  "nuestra",
  "nuestros",
  "nuestras",
  "vuestro",
  "vuestra",
  "vuestros",
  "vuestras",
  "cuyo",
  "cuya",
  "cuyos",
  "cuyas",
  "quien",
  "quién",
  "quienes",
  "quiénes",
  "cual",
  "cuál",
  "cuales",
  "cuáles",
  "cuanto",
  "cuánto",
  "cuanta",
  "cuánta",
  "cuantos",
  "cuántos",
  "cuantas",
  "cuántas",

  // Adverbios, conectores y palabras vacías
  "no",
  "mas",
  "más",
  "tan",
  "muy",
  "aun",
  "aún",
  "asi",
  "así",
  "aca",
  "acá",
  "ahi",
  "ahí",
  "alli",
  "allí",
  "aqui",
  "aquí",
  "bien",
  "mal",
  "solo",
  "sólo",
  "siempre",
  "nunca",
  "jamas",
  "jamás",
  "nada",
  "todo",
  "todos",
  "todas",
  "algo",
  "alguien",
  "nadie",
  "otro",
  "otra",
  "otros",
  "otras",
  "cada",
  "mucho",
  "mucha",
  "muchos",
  "muchas",
  "poco",
  "poca",
  "pocos",
  "pocas",
  "menos",
  "tambien",
  "también",
  "tampoco",
  "demas",
  "demás",
  "quizas",
  "quizá",
  "quizás",

  // Formas verbales auxiliares comunes (ser, estar, haber, hacer, tener)
  "es",
  "son",
  "era",
  "eran",
  "fue",
  "fueron",
  "ser",
  "sea",
  "sean",
  "sido",
  "esta",
  "está",
  "estan",
  "están",
  "este",
  "esté",
  "estaba",
  "estar",
  "ha",
  "han",
  "has",
  "he",
  "hemos",
  "hay",
  "habia",
  "había",
  "haber",
  "hace",
  "hacer",
  "hizo",
  "hacen",
  "tiene",
  "tienen",
  "tenemos",
  "tener",
  "tenia",
  "tenía",

  // Stop words en Inglés (comunes en contexto corporativo multinacional Epiroc)
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "up",
  "about",
  "into",
  "over",
  "after",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "will",
  "would",
  "should",
  "not",
  "no",
  "so",
  "as",
  "if",
  "it",
  "its",
  "you",
  "your",
  "we",
  "our",
  "us",
  "they",
  "them",
  "their",
  "this",
  "that",
  "these",
  "those",
  "all",
  "any",
  "more",
  "most",
  "just",
]);

/**
 * Normaliza un token removiendo marcas diacríticas para comparaciones insensibles a acentos.
 */
export function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Formatea una palabra para su visualización elegante:
 * - Siglas y acrónimos cortos (ej. EPIROC, KPI, SLA) se conservan en mayúsculas.
 * - Palabras comunes se capitalizan (Title Case: primera letra mayúscula, resto minúscula).
 */
export function formatDisplayWord(token: string): string {
  const trimmed = token.trim();
  if (
    trimmed.length <= 5 &&
    trimmed === trimmed.toUpperCase() &&
    !/^\d+$/.test(trimmed)
  ) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Tokeniza un texto en palabras individuales, ignorando puntuación, números y stop words.
 */
export function tokenizeText(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  // Coincide con secuencias de letras y números Unicode (soporta acentos y eñes)
  const matches = text.match(/[\p{L}\p{N}]+/gu);
  if (!matches) return [];

  const validTokens: string[] = [];

  for (const match of matches) {
    const raw = match.trim();
    // Omitir palabras demasiado cortas (< 3 caracteres) y números puros
    if (raw.length < 3 || /^\d+$/.test(raw)) continue;

    const lower = raw.toLowerCase();
    const unaccented = removeDiacritics(lower);

    // Omitir si es un stop word conocido
    if (STOP_WORDS.has(lower) || STOP_WORDS.has(unaccented)) continue;

    validTokens.push(raw);
  }

  return validTokens;
}

/**
 * Extrae y acumula las frecuencias de palabras a partir de las respuestas de los participantes.
 * Prioriza `rawAnswers` cuando están disponibles; si no, utiliza las entradas de `liveResults`.
 */
export function extractWordFrequencies(
  rawAnswers?: Array<{ answer_payload?: string }>,
  liveResults?: Record<string, number>,
): WordCloudItem[] {
  const counts = new Map<string, number>();
  const displayMap = new Map<string, string>();

  const processText = (text: string, weight = 1) => {
    const tokens = tokenizeText(text);
    for (const token of tokens) {
      const canonical = removeDiacritics(token.toLowerCase());
      counts.set(canonical, (counts.get(canonical) || 0) + weight);

      // Guardar la mejor representación visual (preferir la que conserve acentos legítimos)
      const currentDisplay = displayMap.get(canonical);
      const formatted = formatDisplayWord(token);
      if (!currentDisplay) {
        displayMap.set(canonical, formatted);
      } else if (
        token.length > canonical.length &&
        currentDisplay.length <= canonical.length
      ) {
        displayMap.set(canonical, formatted);
      }
    }
  };

  if (rawAnswers && rawAnswers.length > 0) {
    for (const item of rawAnswers) {
      if (item.answer_payload) {
        processText(item.answer_payload, 1);
      }
    }
  } else if (liveResults && Object.keys(liveResults).length > 0) {
    for (const [phrase, count] of Object.entries(liveResults)) {
      processText(phrase, Number(count) || 1);
    }
  }

  const items: WordCloudItem[] = [];
  for (const [canonical, count] of counts.entries()) {
    items.push({
      word: displayMap.get(canonical) || canonical,
      count,
    });
  }

  // Ordenar de mayor a menor frecuencia
  items.sort((a, b) => b.count - a.count);

  return items;
}

/**
 * Reordena los elementos de la nube de palabras de forma ponderada hacia el centro:
 * Los términos más frecuentes se ubican al medio y los de menor frecuencia a los bordes,
 * recreando la silueta balanceada de nubes tipo Mentimeter/Wordle.
 */
export function centerWeightedOrder<T>(items: T[]): T[] {
  const result: T[] = [];
  items.forEach((item, index) => {
    if (index % 2 === 0) {
      result.push(item);
    } else {
      result.unshift(item);
    }
  });
  return result;
}

/**
 * Calcula la escala de tamaño de fuente en rem en función de la frecuencia relativa.
 * Rango dinámico: 1.2rem (mínimo) hasta 3.3rem (máximo).
 */
export function calculateWordScale(
  count: number,
  maxCount: number,
  minCount = 1,
): number {
  if (maxCount <= 1) return 1.35;
  if (maxCount === minCount) return 1.5;

  const ratio = (count - minCount) / (maxCount - minCount);
  const scale = 1.2 + ratio * 2.1;
  return Number(Math.min(3.3, Math.max(1.2, scale)).toFixed(2));
}
