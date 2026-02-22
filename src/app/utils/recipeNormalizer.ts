/**
 * recipeNormalizer.ts
 * ═══════════════════════════════════════════════════════════════════════════
 * Arquitectura modular para normalizar recetas desde texto libre.
 *
 * PIPELINE:
 *  Input (texto libre)
 *    │
 *    ▼
 *  [1] Preprocesador     → limpia ruido, detecta idioma, segmenta secciones
 *    │
 *    ▼
 *  [2] ExtractorIngredientes → parsea cantidad + unidad + nombre, normaliza
 *    │
 *    ▼
 *  [3] ExtractorPasos    → construye pasos numerados ordenados en español
 *    │
 *    ▼
 *  [4] EstimadorRaciones → jerarquía de señales → confianza + justificación
 *    │
 *    ▼
 *  [5] Gemini AI         → refinamiento final con LLM gratuito
 *    │
 *    ▼
 *  Output (NormalizedRecipe)
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface NormalizedIngredient {
  name: string;
  quantity: string;
  unit: string;
  normalizedGrams?: number;   // conversión interna a gramos/ml
}

export interface NormalizedStep {
  step: number;
  text: string;
  timerMinutes?: number;
}

export interface ServingsEstimate {
  servings: number;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  justification: string;
}

export interface NormalizedRecipe {
  is_recipe: boolean;
  language?: string;
  name?: string;
  description?: string;
  ingredients?: NormalizedIngredient[];
  instructions?: NormalizedStep[];
  photos?: string[];
  videoUrl?: string;
  categories?: string[];
  tags?: string[];
  servings?: number;
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
  confidence?: number;          // 0–1 confianza global del parsing
  servingsEstimate?: ServingsEstimate;
}

// ─── [1] PREPROCESADOR ────────────────────────────────────────────────────────

/**
 * Limpia el texto de ruido propio de redes sociales y detecta el idioma.
 */
export function preprocessText(raw: string): {
  cleaned: string;
  language: string;
  sections: { title?: string; ingredients?: string; instructions?: string };
} {
  let text = raw;

  // Normalizar saltos de línea
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Eliminar hashtags
  text = text.replace(/#\w+/g, '');
  // Eliminar URLs
  text = text.replace(/https?:\/\/\S+/g, '');
  // Eliminar emojis (rango Unicode amplio)
  text = text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '');
  text = text.replace(/[\u{2600}-\u{27FF}]/gu, '');
  // Normalizar bullets variados a guion
  text = text.replace(/^[•◦▪▸➤→*]\s*/gm, '- ');
  // Colapsar líneas en blanco múltiples
  text = text.replace(/\n{3,}/g, '\n\n');

  const cleaned = text.trim();
  const language = detectLanguage(cleaned);
  const sections = segmentSections(cleaned, language);

  return { cleaned, language, sections };
}

/** Detecta idioma por vocabulario de cocina */
export function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = { es: 0, en: 0, fr: 0, it: 0, pt: 0 };

  const vocab: Record<string, string[]> = {
    es: ['ingrediente', 'cucharada', 'taza', 'mezcla', 'hornear', 'preparación', 'pizca', 'ajo', 'cebolla'],
    en: ['ingredient', 'tablespoon', 'teaspoon', 'cup', 'mix', 'bake', 'preparation', 'pinch', 'garlic', 'onion'],
    fr: ['ingrédient', 'cuillère', 'tasse', 'mélanger', 'cuire', 'préparation', 'pincée', 'ail', 'oignon'],
    it: ['ingrediente', 'cucchiaio', 'tazza', 'mescolare', 'cuocere', 'preparazione', 'pizzico', 'aglio', 'cipolla'],
    pt: ['ingrediente', 'colher', 'xícara', 'misturar', 'cozinhar', 'preparação', 'pitada', 'alho', 'cebola'],
  };

  for (const [lang, words] of Object.entries(vocab)) {
    scores[lang] = words.filter(w => lower.includes(w)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'es';
}

/** Segmenta el texto en secciones reconocibles */
function segmentSections(
  text: string,
  lang: string
): { title?: string; ingredients?: string; instructions?: string } {
  const lines = text.split('\n');

  const ingKeywords: Record<string, RegExp> = {
    es: /^(ingredient[e]?s?|para la|para el|para los)\s*[:：]?\s*$/i,
    en: /^(ingredient[s]?|for the)\s*[:：]?\s*$/i,
    fr: /^(ingrédient[s]?|pour (la|le|les))\s*[:：]?\s*$/i,
    it: /^(ingredient[i]?|per (la|il|i|le))\s*[:：]?\s*$/i,
    pt: /^(ingredient[e]?s?|para (a|o|os|as))\s*[:：]?\s*$/i,
  };

  const stepKeywords: Record<string, RegExp> = {
    es: /^(preparación|instrucciones|pasos?|elaboración|procedimiento|modo de preparación)\s*[:：]?\s*$/i,
    en: /^(preparation|instructions?|steps?|directions?|method)\s*[:：]?\s*$/i,
    fr: /^(préparation|instructions?|étapes?|méthode)\s*[:：]?\s*$/i,
    it: /^(preparazione|istruzioni|passaggi|metodo)\s*[:：]?\s*$/i,
    pt: /^(preparação|instruções|passos?|método)\s*[:：]?\s*$/i,
  };

  const ingRe = ingKeywords[lang] || ingKeywords.es;
  const stepRe = stepKeywords[lang] || stepKeywords.es;

  let ingStart = -1, stepStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (ingRe.test(lines[i].trim()) && ingStart === -1) ingStart = i;
    if (stepRe.test(lines[i].trim()) && stepStart === -1) stepStart = i;
  }

  const title = lines[0]?.trim() || undefined;

  const ingredientsLines =
    ingStart !== -1
      ? lines.slice(ingStart + 1, stepStart !== -1 ? stepStart : undefined)
      : [];

  const instructionsLines =
    stepStart !== -1 ? lines.slice(stepStart + 1) : [];

  return {
    title,
    ingredients: ingredientsLines.join('\n') || undefined,
    instructions: instructionsLines.join('\n') || undefined,
  };
}

// ─── [2] EXTRACTOR DE INGREDIENTES ───────────────────────────────────────────

/** Tabla de conversión a gramos o ml */
const UNIT_CONVERSIONS: Record<string, { canonical: string; toGrams: number }> = {
  // Peso seco
  g: { canonical: 'g', toGrams: 1 },
  gr: { canonical: 'g', toGrams: 1 },
  gramo: { canonical: 'g', toGrams: 1 },
  gramos: { canonical: 'g', toGrams: 1 },
  kg: { canonical: 'kg', toGrams: 1000 },
  kilo: { canonical: 'kg', toGrams: 1000 },
  kilos: { canonical: 'kg', toGrams: 1000 },
  kilogramo: { canonical: 'kg', toGrams: 1000 },
  kilogramos: { canonical: 'kg', toGrams: 1000 },
  oz: { canonical: 'oz', toGrams: 28.35 },
  lb: { canonical: 'lb', toGrams: 453.6 },
  libra: { canonical: 'lb', toGrams: 453.6 },
  libras: { canonical: 'lb', toGrams: 453.6 },
  // Volumen
  ml: { canonical: 'ml', toGrams: 1 },
  mililitro: { canonical: 'ml', toGrams: 1 },
  mililitros: { canonical: 'ml', toGrams: 1 },
  l: { canonical: 'l', toGrams: 1000 },
  litro: { canonical: 'l', toGrams: 1000 },
  litros: { canonical: 'l', toGrams: 1000 },
  // Medidas de cocina
  taza: { canonical: 'taza', toGrams: 240 },
  tazas: { canonical: 'taza', toGrams: 240 },
  cup: { canonical: 'taza', toGrams: 240 },
  cups: { canonical: 'taza', toGrams: 240 },
  cucharada: { canonical: 'cucharada', toGrams: 15 },
  cucharadas: { canonical: 'cucharada', toGrams: 15 },
  cda: { canonical: 'cucharada', toGrams: 15 },
  cdas: { canonical: 'cucharada', toGrams: 15 },
  tbsp: { canonical: 'cucharada', toGrams: 15 },
  cucharadita: { canonical: 'cucharadita', toGrams: 5 },
  cucharaditas: { canonical: 'cucharadita', toGrams: 5 },
  cdta: { canonical: 'cucharadita', toGrams: 5 },
  cdtas: { canonical: 'cucharadita', toGrams: 5 },
  tsp: { canonical: 'cucharadita', toGrams: 5 },
  // Unidades discretas
  pizca: { canonical: 'pizca', toGrams: 0.5 },
  pizcas: { canonical: 'pizca', toGrams: 0.5 },
  pinch: { canonical: 'pizca', toGrams: 0.5 },
  diente: { canonical: 'diente', toGrams: 5 },
  dientes: { canonical: 'diente', toGrams: 5 },
  clove: { canonical: 'diente', toGrams: 5 },
  cloves: { canonical: 'diente', toGrams: 5 },
  rebanada: { canonical: 'rebanada', toGrams: 30 },
  rebanadas: { canonical: 'rebanada', toGrams: 30 },
  slice: { canonical: 'rebanada', toGrams: 30 },
  slices: { canonical: 'rebanada', toGrams: 30 },
  unidad: { canonical: 'unidad', toGrams: 100 },
  unidades: { canonical: 'unidad', toGrams: 100 },
  pieza: { canonical: 'unidad', toGrams: 100 },
  piezas: { canonical: 'unidad', toGrams: 100 },
};

/** Parsea una fracción tipo "1/2" o "3/4" */
function parseFraction(s: string): number {
  const parts = s.split('/');
  if (parts.length === 2) {
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }
  return parseFloat(s);
}

/** Convierte texto de cantidad a número */
function parseQuantity(raw: string): number {
  // Rangos: "2-3" → promedio
  const rangeMatch = raw.match(/^([\d.,/]+)\s*[-–]\s*([\d.,/]+)$/);
  if (rangeMatch) {
    return (parseFraction(rangeMatch[1]) + parseFraction(rangeMatch[2])) / 2;
  }
  // Número mixto: "1 1/2"
  const mixedMatch = raw.match(/^(\d+)\s+([\d]+\/[\d]+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseFraction(mixedMatch[2]);
  }
  return parseFraction(raw.replace(',', '.'));
}

export function extractIngredients(text: string): NormalizedIngredient[] {
  const ingredients: NormalizedIngredient[] = [];
  if (!text) return ingredients;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Patrón: cantidad opcional + unidad opcional + nombre
  const unitNames = Object.keys(UNIT_CONVERSIONS).join('|');
  const pattern = new RegExp(
    `^-?\\s*` +
    `((?:\\d+[.,/]?\\d*\\s*(?:[-–]\\s*\\d+[.,/]?\\d*)?|\\d+\\s+\\d+\\/\\d+))?\\s*` +
    `(${unitNames})\\.?\\s+` +
    `(?:de\\s+|of\\s+)?(.+)$`,
    'i'
  );

  // Patrón sin unidad
  const noUnitPattern = /^-?\s*((?:\d+[.,/]?\d*(?:\s*[-–]\s*\d+[.,/]?\d*)?|\d+\s+\d+\/\d+)\s*)(.+)$/i;

  for (const line of lines) {
    if (!line || line.length < 2) continue;

    const m = line.match(pattern);
    if (m) {
      const rawQty = (m[1] || '').trim();
      const rawUnit = (m[2] || '').trim().toLowerCase();
      const name = (m[3] || '').trim();
      const conv = UNIT_CONVERSIONS[rawUnit];
      const qty = rawQty ? parseQuantity(rawQty) : 1;

      ingredients.push({
        name: cleanIngredientName(name),
        quantity: rawQty || '',
        unit: conv?.canonical || rawUnit,
        normalizedGrams: conv ? qty * conv.toGrams : undefined,
      });
      continue;
    }

    const m2 = line.match(noUnitPattern);
    if (m2) {
      ingredients.push({
        name: cleanIngredientName(m2[2].trim()),
        quantity: m2[1].trim(),
        unit: '',
      });
      continue;
    }

    // Línea sin cantidad ni unidad
    const clean = line.replace(/^-\s*/, '').trim();
    if (clean.length > 1) {
      ingredients.push({ name: cleanIngredientName(clean), quantity: '', unit: '' });
    }
  }

  return ingredients;
}

function cleanIngredientName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')   // eliminar paréntesis y contenido
    .replace(/,.*$/, '')        // eliminar notas después de coma
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ─── [3] EXTRACTOR DE PASOS ───────────────────────────────────────────────────

/** Verbos de acción para detectar pasos implícitos */
const ACTION_VERBS: Record<string, string[]> = {
  es: ['mezcla', 'añade', 'agrega', 'cocina', 'hierve', 'calienta', 'corta', 'pica',
       'bate', 'revuelve', 'sirve', 'coloca', 'vierte', 'precalienta', 'hornea',
       'fríe', 'dora', 'saltea', 'marina', 'reserva', 'deja', 'incorpora', 'integra'],
  en: ['mix', 'add', 'cook', 'boil', 'heat', 'cut', 'chop', 'beat', 'stir', 'serve',
       'place', 'pour', 'preheat', 'bake', 'fry', 'brown', 'sauté', 'marinate', 'let'],
  fr: ['mélanger', 'ajouter', 'cuire', 'bouillir', 'chauffer', 'couper', 'hacher',
       'battre', 'remuer', 'servir', 'placer', 'verser', 'préchauffer'],
  it: ['mescolare', 'aggiungere', 'cuocere', 'bollire', 'scaldare', 'tagliare',
       'tritare', 'battere', 'servire', 'versare', 'preriscaldare'],
  pt: ['misturar', 'adicionar', 'cozinhar', 'ferver', 'aquecer', 'cortar', 'picar',
       'bater', 'mexer', 'servir', 'colocar', 'preaquecer'],
};

/** Extrae tiempo en minutos de un texto ("20 minutos", "1 hora") */
function extractTimer(text: string): number | undefined {
  const hourMatch = text.match(/(\d+)\s*(?:hora[s]?|hour[s]?|h\b)/i);
  const minMatch = text.match(/(\d+)\s*(?:minuto[s]?|minute[s]?|min\b)/i);
  let total = 0;
  if (hourMatch) total += parseInt(hourMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  return total > 0 ? total : undefined;
}

export function extractSteps(text: string, lang: string): NormalizedStep[] {
  if (!text) return [];

  const steps: NormalizedStep[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const verbs = ACTION_VERBS[lang] || ACTION_VERBS.es;
  let stepNum = 1;

  for (const line of lines) {
    // Paso numerado explícito: "1." "1)" "Paso 1:"
    const numbered = line.match(/^(?:paso\s*)?(\d+)[.\):\-]\s*(.+)/i);
    if (numbered) {
      const desc = numbered[2].trim();
      steps.push({ step: parseInt(numbered[1]), text: desc, timerMinutes: extractTimer(desc) });
      stepNum = parseInt(numbered[1]) + 1;
      continue;
    }

    // Paso con guion o bullet
    const bulleted = line.match(/^[-•]\s*(.+)/);
    if (bulleted) {
      const desc = bulleted[1].trim();
      steps.push({ step: stepNum++, text: desc, timerMinutes: extractTimer(desc) });
      continue;
    }

    // Línea que empieza con verbo de acción
    const lower = line.toLowerCase();
    if (line.length > 15 && verbs.some(v => lower.startsWith(v))) {
      steps.push({ step: stepNum++, text: line, timerMinutes: extractTimer(line) });
    }
  }

  // Renumerar secuencialmente (por si venían desordenados)
  return steps
    .sort((a, b) => a.step - b.step)
    .map((s, i) => ({ ...s, step: i + 1 }));
}

// ─── [4] ESTIMADOR DE RACIONES ────────────────────────────────────────────────

/**
 * Jerarquía de señales:
 *  a) Mención explícita ("para 4 personas", "8 servings")
 *  b) Anclas discretas (n° de tacos, hamburguesas, panes, etc.)
 *  c) Masa de proteína principal ÷ 113 g por persona
 *  d) Fallback = 4
 */
export function estimateServings(
  text: string,
  ingredients: NormalizedIngredient[]
): ServingsEstimate {

  // ── a) Mención explícita ─────────────────────────────────────────────────
  const explicitPatterns = [
    /(?:para|rinde|alcanza|porciones?|raciones?)\s*:?\s*(\d+(?:\s*[-–]\s*\d+)?)/i,
    /(\d+(?:\s*[-–]\s*\d+)?)\s*(?:personas?|porciones?|raciones?|comensales?|servings?|portions?|people)/i,
    /makes?\s+(\d+)/i,
    /yields?\s+(\d+)/i,
    /serves?\s+(\d+)/i,
  ];

  for (const pat of explicitPatterns) {
    const m = text.match(pat);
    if (m) {
      const raw = m[1];
      const rangeM = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
      const value = rangeM
        ? Math.round((parseInt(rangeM[1]) + parseInt(rangeM[2])) / 2)
        : parseInt(raw);

      return {
        servings: value,
        confidence: 'high',
        method: 'explicit',
        justification: `El texto menciona explícitamente "${m[0].trim()}"`,
      };
    }
  }

  // ── b) Anclas discretas ───────────────────────────────────────────────────
  const discreteAnchors: [RegExp, string][] = [
    [/(\d+)\s*(?:tacos?|taco)/i, 'tacos'],
    [/(\d+)\s*(?:hamburguesas?|burger[s]?|patties|patty)/i, 'hamburguesas'],
    [/(\d+)\s*(?:pan(?:es)?|bun[s]?|roll[s]?)/i, 'panes'],
    [/(\d+)\s*(?:porciones?|portions?|pieces?|piezas?)/i, 'porciones'],
    [/(\d+)\s*(?:tortillas?)/i, 'tortillas'],
    [/(\d+)\s*(?:empanadas?|empanada)/i, 'empanadas'],
    [/(\d+)\s*(?:crepe[s]?|panqueques?)/i, 'crepes'],
    [/(\d+)\s*(?:cupcakes?|muffins?)/i, 'cupcakes'],
    [/(\d+)\s*(?:cookies?|galletas?)/i, 'galletas'],
    [/(\d+)\s*(?:pancakes?|hotcakes?)/i, 'pancakes'],
  ];

  const anchorsFound: { value: number; label: string }[] = [];
  for (const [pat, label] of discreteAnchors) {
    const m = text.match(pat);
    if (m) anchorsFound.push({ value: parseInt(m[1]), label });
  }

  if (anchorsFound.length > 0) {
    // Si hay conflicto (ej. panes vs patties), usar el menor
    const minAnchor = anchorsFound.reduce((a, b) => a.value <= b.value ? a : b);
    return {
      servings: minAnchor.value,
      confidence: anchorsFound.length > 1 ? 'high' : 'medium',
      method: 'discrete_anchor',
      justification: anchorsFound.length > 1
        ? `Múltiples anclas detectadas (${anchorsFound.map(a => `${a.value} ${a.label}`).join(', ')}); se usó el menor (${minAnchor.value} ${minAnchor.label})`
        : `Se detectaron ${minAnchor.value} ${minAnchor.label} en la receta`,
    };
  }

  // ── c) Masa de proteína principal ─────────────────────────────────────────
  const proteinKeywords = [
    'carne', 'pollo', 'cerdo', 'res', 'ternera', 'pescado', 'camarón', 'camarones',
    'salmón', 'atún', 'pavo', 'cordero', 'conejo', 'tofu',
    'chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon', 'turkey', 'lamb',
  ];

  let totalProteinGrams = 0;
  const proteinsFound: string[] = [];

  for (const ing of ingredients) {
    const nameLower = ing.name.toLowerCase();
    const isProtein = proteinKeywords.some(k => nameLower.includes(k));
    if (isProtein && ing.normalizedGrams && ing.normalizedGrams > 50) {
      totalProteinGrams += ing.normalizedGrams;
      proteinsFound.push(`${ing.quantity} ${ing.unit} ${ing.name}`.trim());
    }
  }

  if (totalProteinGrams > 100) {
    const GRAMS_PER_PERSON = 113; // porción estándar USDA
    const estimated = Math.max(1, Math.round(totalProteinGrams / GRAMS_PER_PERSON));
    return {
      servings: estimated,
      confidence: 'medium',
      method: 'protein_mass',
      justification: `${totalProteinGrams.toFixed(0)}g de proteína (${proteinsFound.join(', ')}) ÷ ${GRAMS_PER_PERSON}g/persona ≈ ${estimated} porciones`,
    };
  }

  // ── d) Fallback ───────────────────────────────────────────────────────────
  return {
    servings: 4,
    confidence: 'low',
    method: 'fallback',
    justification: 'No se encontraron señales suficientes para estimar; se usa el valor predeterminado de 4 porciones',
  };
}

// ─── [5] GEMINI AI — refinamiento final ───────────────────────────────────────

function getGeminiKey(): string {
  // Priority: sessionStorage (entered via UI) → window var → .env build-time var
  const fromSession = sessionStorage.getItem('sc_geminikey');
  const fromWindow = (window as any).__GEMINI_KEY__;
  const fromEnv = import.meta.env.VITE_GEMINI_API_KEY;
  const key = fromSession || fromWindow || fromEnv || '';
  if (!key) {
    console.warn('[Gemini] No API key found. Set VITE_GEMINI_API_KEY in .env or enter it via UI settings.');
  }
  return key;
}

const NORMALIZE_PROMPT = (text: string) => `
Eres un asistente experto en recetas de cocina. Normaliza la siguiente receta y responde ÚNICAMENTE con JSON válido.

TEXTO DE ENTRADA:
${text}

Responde con este JSON exacto (sin markdown, sin explicaciones):
{
  "is_recipe": true,
  "name": "Nombre de la receta en español",
  "description": "Descripción breve en 1-2 frases",
  "servings": 4,
  "prep_time": "15 min",
  "cook_time": "30 min",
  "total_time": "45 min",
  "ingredients": [
    { "name": "nombre del ingrediente", "quantity": "200", "unit": "g" }
  ],
  "steps": [
    { "step": 1, "text": "Descripción clara del paso en español", "timerMinutes": null }
  ],
  "tags": ["fácil", "rápido"],
  "categories": ["Platos principales"]
}

Si NO es una receta: { "is_recipe": false }

REGLAS:
- Todo en español
- unit solo puede ser: "g", "kg", "ml", "l", "taza", "cucharada", "cucharadita", "unidad", "pizca", o ""
- quantity siempre string ("200", "1/2", "")
- timerMinutes: número entero o null
- prep_time/cook_time/total_time: string tipo "15 min" o null si no se menciona
- Los pasos deben ser claros, concisos y en orden lógico
`.trim();

async function refineWithGemini(text: string): Promise<NormalizedRecipe | null> {
  const key = getGeminiKey();
  if (!key) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;

  console.log('[Gemini Normalizer] Sending request, model: gemini-2.5-flash-lite');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: NORMALIZE_PROMPT(text) }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    }),
  });

  console.log('[Gemini Normalizer] Response status:', response.status);

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Gemini Normalizer] Error:', errBody);
    return null;
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(clean) as NormalizedRecipe;
  } catch {
    return null;
  }
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Pipeline completo:
 * 1. Preprocesar → 2. Extraer ingredientes → 3. Extraer pasos
 * → 4. Estimar raciones → 5. Refinar con Gemini (si hay key)
 * → Output NormalizedRecipe
 */
export async function normalizeRecipeFromTextAsync(inputText: string): Promise<NormalizedRecipe> {
  if (!inputText || inputText.trim().length < 30) {
    return { is_recipe: false };
  }

  // ── Intentar con Gemini primero si hay key ─────────────────────────────────
  const geminiKey = getGeminiKey();
  if (geminiKey) {
    const geminiResult = await refineWithGemini(inputText);

    if (geminiResult?.is_recipe && geminiResult.ingredients?.length) {
      // Gemini dio resultado: aplicar estimación de raciones encima si mejorarla
      const { cleaned } = preprocessText(inputText);
      const ingredients = geminiResult.ingredients as NormalizedIngredient[];
      const servingsEstimate = estimateServings(cleaned, ingredients);

      // Si Gemini ya dio servings explícito, dar alta confianza; si no, usar estimador
      const finalServings = geminiResult.servings || servingsEstimate.servings;
      const finalEstimate: ServingsEstimate = geminiResult.servings
        ? {
            servings: geminiResult.servings,
            confidence: 'high',
            method: 'explicit',
            justification: `Gemini detectó "${geminiResult.servings} porciones" directamente en el texto`,
          }
        : servingsEstimate;

      return {
        ...geminiResult,
        is_recipe: true,
        servings: finalServings,
        servingsEstimate: finalEstimate,
        confidence: 0.95,
        language: detectLanguage(inputText),
      };
    }
  }

  // ── Fallback: pipeline local sin IA ───────────────────────────────────────
  const { cleaned, language, sections } = preprocessText(inputText);

  const ingText = sections.ingredients || cleaned;
  const stepText = sections.instructions || cleaned;

  const ingredients = extractIngredients(ingText);
  const steps = extractSteps(stepText, language);

  if (ingredients.length === 0 && steps.length === 0) {
    return { is_recipe: false };
  }

  const servingsEstimate = estimateServings(cleaned, ingredients);

  // Confianza global basada en completitud
  let confidence = 0;
  if (sections.title) confidence += 0.2;
  if (ingredients.length >= 3) confidence += 0.3;
  else if (ingredients.length >= 1) confidence += 0.15;
  if (steps.length >= 3) confidence += 0.3;
  else if (steps.length >= 1) confidence += 0.15;
  if (ingredients.some(i => i.quantity)) confidence += 0.2;

  const tags = generateTags(cleaned, language);

  return {
    is_recipe: true,
    language,
    name: sections.title || 'Receta sin título',
    description: '',
    ingredients,
    instructions: steps,
    photos: [],
    videoUrl: '',
    categories: [],
    tags,
    servings: servingsEstimate.servings,
    confidence: Math.min(confidence, 1),
    servingsEstimate,
  };
}

/** Versión síncrona para compatibilidad con código existente */
export function normalizeRecipeFromText(inputText: string): NormalizedRecipe {
  if (!inputText || inputText.trim().length < 30) return { is_recipe: false };

  const { cleaned, language, sections } = preprocessText(inputText);
  const ingText = sections.ingredients || cleaned;
  const stepText = sections.instructions || cleaned;
  const ingredients = extractIngredients(ingText);
  const steps = extractSteps(stepText, language);

  if (ingredients.length === 0 && steps.length === 0) return { is_recipe: false };

  const servingsEstimate = estimateServings(cleaned, ingredients);

  let confidence = 0;
  if (sections.title) confidence += 0.2;
  if (ingredients.length >= 3) confidence += 0.3;
  else if (ingredients.length >= 1) confidence += 0.15;
  if (steps.length >= 3) confidence += 0.3;
  else if (steps.length >= 1) confidence += 0.15;
  if (ingredients.some(i => i.quantity)) confidence += 0.2;

  return {
    is_recipe: true,
    language,
    name: sections.title || 'Receta sin título',
    description: '',
    ingredients,
    instructions: steps,
    photos: [],
    videoUrl: '',
    categories: [],
    tags: generateTags(cleaned, language),
    servings: servingsEstimate.servings,
    confidence: Math.min(confidence, 1),
    servingsEstimate,
  };
}

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

function generateTags(text: string, language: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  const keywords: Record<string, [string, string][]> = {
    es: [
      ['postre', 'postre'], ['desayuno', 'desayuno'], ['cena', 'cena'],
      ['almuerzo', 'almuerzo'], ['ensalada', 'ensalada'], ['sopa', 'sopa'],
      ['pasta', 'pasta'], ['arroz', 'arroz'], ['vegano', 'vegano'],
      ['vegetariano', 'vegetariano'], ['sin gluten', 'sin gluten'],
      ['fácil', 'fácil'], ['rápido', 'rápido'], ['horneado', 'horneado'],
    ],
    en: [
      ['dessert', 'postre'], ['breakfast', 'desayuno'], ['dinner', 'cena'],
      ['lunch', 'almuerzo'], ['salad', 'ensalada'], ['soup', 'sopa'],
      ['pasta', 'pasta'], ['rice', 'arroz'], ['vegan', 'vegano'],
      ['vegetarian', 'vegetariano'], ['gluten-free', 'sin gluten'],
      ['easy', 'fácil'], ['quick', 'rápido'], ['baked', 'horneado'],
    ],
  };

  const kws = keywords[language] || keywords.es;
  for (const [keyword, tag] of kws) {
    if (lower.includes(keyword) && !tags.includes(tag)) tags.push(tag);
  }

  return tags.slice(0, 6);
}

// Re-exportar para compatibilidad
export { generateTags };
