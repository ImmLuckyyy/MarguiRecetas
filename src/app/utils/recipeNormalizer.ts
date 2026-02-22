// Utilidad para normalizar recetas desde texto libre en cualquier idioma

import { normalizeIngredient } from './unitConversions';
import { estimateServings, validateServings } from './servingsEstimator';

export interface NormalizedRecipe {
  is_recipe: boolean;
  language?: string;
  name?: string;
  description?: string;
  ingredients?: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  instructions?: Array<{
    step: number;
    text: string;
  }>;
  photos?: string[];
  videoUrl?: string;
  categories?: string[];
  tags?: string[];
  servings?: number;
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
  confidence?: number;
  servingsEstimate?: {
    confidence: 'high' | 'medium' | 'low';
    method: string;
    justification: string;
  };
}

// Detectar idioma del texto
export function detectLanguage(text: string): string {
  const spanishWords = ['ingrediente', 'cucharada', 'taza', 'paso', 'preparación', 'mezcla', 'hornea', 'cocina'];
  const englishWords = ['ingredient', 'tablespoon', 'teaspoon', 'cup', 'step', 'preparation', 'mix', 'bake', 'cook'];
  const frenchWords = ['ingrédient', 'cuillère', 'tasse', 'étape', 'préparation', 'mélanger', 'cuire'];
  const italianWords = ['ingrediente', 'cucchiaio', 'tazza', 'passo', 'preparazione', 'mescolare', 'cuocere'];
  const portugueseWords = ['ingrediente', 'colher', 'xícara', 'passo', 'preparação', 'misturar', 'cozinhar'];

  const lowerText = text.toLowerCase();
  
  const counts = {
    es: spanishWords.filter(word => lowerText.includes(word)).length,
    en: englishWords.filter(word => lowerText.includes(word)).length,
    fr: frenchWords.filter(word => lowerText.includes(word)).length,
    it: italianWords.filter(word => lowerText.includes(word)).length,
    pt: portugueseWords.filter(word => lowerText.includes(word)).length,
  };

  const detected = Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  return counts[detected] > 0 ? detected : 'es'; // Default español
}

// Limpiar texto de ruido
function cleanText(text: string): string {
  // Remover emojis
  let cleaned = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  // Remover hashtags
  cleaned = cleaned.replace(/#\w+/g, '');
  // Remover URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  // Remover múltiples espacios
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// Extraer título de la receta
function extractTitle(text: string, language: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // Buscar líneas con palabras clave de título
  const titleKeywords: Record<string, string[]> = {
    es: ['receta de', 'cómo hacer', 'preparar'],
    en: ['recipe for', 'how to make', 'prepare'],
    fr: ['recette de', 'comment faire'],
    it: ['ricetta di', 'come fare'],
    pt: ['receita de', 'como fazer'],
  };

  const keywords = titleKeywords[language] || titleKeywords.es;
  
  for (const line of lines.slice(0, 5)) {
    const lowerLine = line.toLowerCase();
    for (const keyword of keywords) {
      if (lowerLine.includes(keyword)) {
        return cleanText(line.replace(new RegExp(keyword, 'gi'), '')).trim();
      }
    }
  }

  // Si no encuentra palabras clave, usar la primera línea corta
  const firstShortLine = lines.find(l => l.length > 5 && l.length < 60 && !l.includes(':'));
  return firstShortLine || 'Receta sin título';
}

// Extraer descripción
function extractDescription(text: string, title: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // Buscar las primeras líneas descriptivas (que no sean título, ingredientes o pasos)
  const descriptionLines: string[] = [];
  
  for (const line of lines.slice(0, 10)) {
    if (line === title) continue;
    if (line.match(/^(\d+[.\):-]|[-•*])/)) break;
    if (line.toLowerCase().includes('ingrediente') || line.toLowerCase().includes('ingredient')) break;
    if (line.length > 20 && line.length < 300) {
      descriptionLines.push(line);
      if (descriptionLines.length >= 2) break;
    }
  }

  return cleanText(descriptionLines.join(' '));
}

// Extraer ingredientes mejorado
function extractIngredients(text: string, language: string): Array<{ name: string; quantity: string; unit: string }> {
  const ingredients: Array<{ name: string; quantity: string; unit: string }> = [];
  const lines = text.split('\n');
  
  // Patrones de unidades por idioma
  const unitPatterns: Record<string, string> = {
    es: 'g|kg|ml|l|taza|tazas|cucharada|cucharadas|cdta|cda|unidad|unidades|pizca|pizcas|diente|dientes|c\\.?|cc|gr',
    en: 'g|kg|ml|l|cup|cups|tablespoon|tbsp|teaspoon|tsp|oz|lb|pound|pounds|piece|pieces|pinch',
    fr: 'g|kg|ml|l|tasse|tasses|cuillère|c\\.|càs|càc|pincée|gousse|gousses',
    it: 'g|kg|ml|l|tazza|tazze|cucchiaio|cucchiai|cucchiaino|pizzico|spicchio|spicchi',
    pt: 'g|kg|ml|l|xícara|xícaras|colher|colheres|pitada|dente|dentes',
  };

  const units = unitPatterns[language] || unitPatterns.es;
  
  let inIngredientsSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Detectar inicio de sección de ingredientes
    const lowerLine = trimmedLine.toLowerCase();
    if (lowerLine.match(/^(ingrediente|ingredient|ingrédient|ingredienti)/)) {
      inIngredientsSection = true;
      continue;
    }

    // Detectar fin de sección de ingredientes
    if (lowerLine.match(/^(paso|step|preparación|preparation|étape|procedimento|instruc)/)) {
      break;
    }

    // Extraer ingrediente si estamos en la sección o si tiene formato de lista
    if (inIngredientsSection || trimmedLine.match(/^[-•*]\s/)) {
      // Remover viñetas
      let ingredientText = trimmedLine.replace(/^[-•*]\s*/, '');
      
      // Patrón: cantidad + unidad + ingrediente
      const pattern = new RegExp(
        `^(\\d+(?:[.,/]\\d+)?(?:\\s*-\\s*\\d+(?:[.,/]\\d+)?)?)\\s*(${units})?\\s+(?:de\\s+|of\\s+)?(.+)$`,
        'i'
      );
      
      const match = ingredientText.match(pattern);
      
      if (match) {
        ingredients.push({
          quantity: match[1].replace(',', '.'),
          unit: match[2] || '',
          name: cleanText(match[3])
        });
      } else if (ingredientText.length > 2) {
        // Ingrediente sin cantidad clara
        const simpleMatch = ingredientText.match(/^(.+?)(?:\s*[-–]\s*(.+))?$/);
        ingredients.push({
          quantity: '',
          unit: '',
          name: cleanText(simpleMatch ? simpleMatch[1] : ingredientText)
        });
      }
    }
  }

  return ingredients;
}

// Extraer instrucciones mejorado
function extractInstructions(text: string, language: string): Array<{ step: number; text: string }> {
  const instructions: Array<{ step: number; text: string }> = [];
  const lines = text.split('\n');
  
  // Verbos de acción por idioma
  const actionVerbs: Record<string, string[]> = {
    es: ['mezcla', 'añade', 'agrega', 'cocina', 'hierve', 'calienta', 'corta', 'pica', 'bate', 'revuelve', 'sirve', 'coloca', 'vierte', 'precalienta', 'hornea', 'fríe'],
    en: ['mix', 'add', 'cook', 'boil', 'heat', 'cut', 'chop', 'beat', 'stir', 'serve', 'place', 'pour', 'preheat', 'bake', 'fry'],
    fr: ['mélanger', 'ajouter', 'cuire', 'bouillir', 'chauffer', 'couper', 'hacher', 'battre', 'remuer', 'servir', 'placer', 'verser'],
    it: ['mescolare', 'aggiungere', 'cuocere', 'bollire', 'scaldare', 'tagliare', 'tritare', 'battere', 'mescolare', 'servire'],
    pt: ['misturar', 'adicionar', 'cozinhar', 'ferver', 'aquecer', 'cortar', 'picar', 'bater', 'mexer', 'servir', 'colocar'],
  };

  const verbs = actionVerbs[language] || actionVerbs.es;
  let stepNumber = 1;
  let inInstructionsSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const lowerLine = trimmedLine.toLowerCase();

    // Detectar inicio de sección de instrucciones
    if (lowerLine.match(/^(paso|step|preparación|preparation|préparation|étape|procedimento|instruc|elaboración)/)) {
      inInstructionsSection = true;
      continue;
    }

    // Si ya encontramos ingredientes, los pasos vienen después
    if (!inInstructionsSection && lowerLine.includes('ingrediente')) {
      continue;
    }

    // Paso numerado explícito
    const numberedMatch = trimmedLine.match(/^(\d+)[.\):-]\s*(.+)/);
    if (numberedMatch) {
      inInstructionsSection = true;
      instructions.push({
        step: parseInt(numberedMatch[1]),
        text: cleanText(numberedMatch[2])
      });
      stepNumber = parseInt(numberedMatch[1]) + 1;
      continue;
    }

    // Paso con viñeta
    const bulletMatch = trimmedLine.match(/^[-•*]\s*(.+)/);
    if (bulletMatch && inInstructionsSection) {
      instructions.push({
        step: stepNumber++,
        text: cleanText(bulletMatch[1])
      });
      continue;
    }

    // Detectar paso por verbo de acción al inicio
    if (trimmedLine.length > 20) {
      const startsWithVerb = verbs.some(verb => lowerLine.startsWith(verb));
      if (startsWithVerb && !trimmedLine.includes(':')) {
        inInstructionsSection = true;
        instructions.push({
          step: stepNumber++,
          text: cleanText(trimmedLine)
        });
      }
    }
  }

  return instructions;
}

// Extraer tiempos
function extractTimes(text: string, language: string): {
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
} {
  const timePatterns: Record<string, RegExp[]> = {
    es: [
      /preparación[:\s]*(\d+\s*(?:min|minuto|minutos|h|hora|horas))/i,
      /cocción[:\s]*(\d+\s*(?:min|minuto|minutos|h|hora|horas))/i,
      /tiempo total[:\s]*(\d+\s*(?:min|minuto|minutos|h|hora|horas))/i,
    ],
    en: [
      /prep(?:aration)? time[:\s]*(\d+\s*(?:min|minute|minutes|h|hour|hours))/i,
      /cook(?:ing)? time[:\s]*(\d+\s*(?:min|minute|minutes|h|hour|hours))/i,
      /total time[:\s]*(\d+\s*(?:min|minute|minutes|h|hour|hours))/i,
    ],
  };

  const patterns = timePatterns[language] || timePatterns.es;
  const result: { prep_time?: string; cook_time?: string; total_time?: string } = {};

  const prepMatch = text.match(patterns[0]);
  if (prepMatch) result.prep_time = prepMatch[1];

  const cookMatch = text.match(patterns[1]);
  if (cookMatch) result.cook_time = cookMatch[1];

  const totalMatch = text.match(patterns[2]);
  if (totalMatch) result.total_time = totalMatch[1];

  return result;
}

// Extraer porciones
function extractServings(text: string, language: string): number {
  const servingsPatterns: Record<string, RegExp[]> = {
    es: [
      /(?:para|rinde|porciones)[:\s]*(\d+(?:\s*-\s*\d+)?)/i,
      /(\d+)\s*(?:personas|porciones|comensales)/i,
    ],
    en: [
      /(?:serves|servings|yields)[:\s]*(\d+(?:\s*-\s*\d+)?)/i,
      /(\d+)\s*(?:people|servings|portions)/i,
    ],
  };

  const patterns = servingsPatterns[language] || servingsPatterns.es;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }

  return 0;
}

// Generar tags automáticos
function generateTags(text: string, language: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Tags de tipo de plato
  const dishTypes: Record<string, Record<string, string>> = {
    es: {
      'postre': 'postre',
      'desayuno': 'desayuno',
      'almuerzo': 'almuerzo',
      'cena': 'cena',
      'entrada': 'entrada',
      'sopa': 'sopa',
      'ensalada': 'ensalada',
      'pasta': 'pasta',
      'arroz': 'arroz',
      'carne': 'carne',
      'pescado': 'pescado',
      'vegetariano': 'vegetariano',
      'vegano': 'vegano',
    },
    en: {
      'dessert': 'dessert',
      'breakfast': 'breakfast',
      'lunch': 'lunch',
      'dinner': 'dinner',
      'appetizer': 'appetizer',
      'soup': 'soup',
      'salad': 'salad',
      'pasta': 'pasta',
      'rice': 'rice',
      'meat': 'meat',
      'fish': 'fish',
      'vegetarian': 'vegetarian',
      'vegan': 'vegan',
    },
  };

  const types = dishTypes[language] || dishTypes.es;
  Object.entries(types).forEach(([keyword, tag]) => {
    if (lowerText.includes(keyword)) tags.push(tag);
  });

  // Tags de técnica
  const techniques: Record<string, string[]> = {
    es: ['horneado', 'frito', 'hervido', 'a la plancha', 'al vapor', 'asado'],
    en: ['baked', 'fried', 'boiled', 'grilled', 'steamed', 'roasted'],
  };

  const techs = techniques[language] || techniques.es;
  techs.forEach(tech => {
    if (lowerText.includes(tech.toLowerCase())) tags.push(tech);
  });

  // Tags de dificultad
  const difficulties: Record<string, Record<string, string>> = {
    es: { 'fácil': 'fácil', 'rápido': 'rápido', 'sencillo': 'fácil' },
    en: { 'easy': 'easy', 'quick': 'quick', 'simple': 'easy' },
  };

  const diffs = difficulties[language] || difficulties.es;
  Object.entries(diffs).forEach(([keyword, tag]) => {
    if (lowerText.includes(keyword) && !tags.includes(tag)) tags.push(tag);
  });

  return tags.slice(0, 5); // Máximo 5 tags
}

// Calcular confidence score
function calculateConfidence(
  ingredients: Array<{ name: string; quantity: string; unit: string }>,
  instructions: Array<{ step: number; text: string }>,
  title: string
): number {
  let score = 0;

  // Tiene título claro (0-0.2)
  score += title && title.length > 3 && title !== 'Receta sin título' ? 0.2 : 0;

  // Número de ingredientes (0-0.3)
  if (ingredients.length >= 3) score += 0.3;
  else if (ingredients.length >= 1) score += 0.15;

  // Ingredientes con cantidades (0-0.2)
  const withQuantities = ingredients.filter(i => i.quantity).length;
  score += (withQuantities / Math.max(ingredients.length, 1)) * 0.2;

  // Número de pasos (0-0.3)
  if (instructions.length >= 3) score += 0.3;
  else if (instructions.length >= 1) score += 0.15;

  return Math.min(Math.round(score * 100) / 100, 1);
}

// Determinar si es una receta
function isRecipeContent(text: string): boolean {
  const recipeKeywords = [
    'ingrediente', 'ingredient', 'ingrédient',
    'paso', 'step', 'étape',
    'preparación', 'preparation', 'préparation',
    'cocina', 'cook', 'cuire',
    'receta', 'recipe', 'recette', 'ricetta'
  ];

  const lowerText = text.toLowerCase();
  const matchCount = recipeKeywords.filter(keyword => lowerText.includes(keyword)).length;

  // Debe tener al menos 2 palabras clave
  return matchCount >= 2 && text.length > 50;
}

// Función principal de normalización
export function normalizeRecipeFromText(inputText: string): NormalizedRecipe {
  // Verificar si es contenido de receta
  if (!isRecipeContent(inputText)) {
    return { is_recipe: false };
  }

  // Detectar idioma
  const language = detectLanguage(inputText);

  // Extraer componentes
  const title = extractTitle(inputText, language);
  const description = extractDescription(inputText, title);
  const ingredients = extractIngredients(inputText, language);
  const instructions = extractInstructions(inputText, language);
  const times = extractTimes(inputText, language);
  const servings = extractServings(inputText, language);
  const tags = generateTags(inputText, language);

  // Calcular confidence
  const confidence = calculateConfidence(ingredients, instructions, title);

  // Validar mínimos
  if (ingredients.length === 0 || instructions.length === 0) {
    return { is_recipe: false };
  }

  // Estimar porciones
  const instructionTexts = instructions.map(i => i.text);
  const estimatedServings = estimateServings(ingredients, instructionTexts, inputText);
  const validatedServings = validateServings(estimatedServings, servings > 0 ? servings : undefined);

  return {
    is_recipe: true,
    language,
    name: title,
    description,
    ingredients,
    instructions,
    photos: [],
    videoUrl: '',
    categories: [],
    tags,
    servings: validatedServings.servings,
    prep_time: times.prep_time,
    cook_time: times.cook_time,
    total_time: times.total_time,
    confidence,
    servingsEstimate: {
      confidence: validatedServings.confidence,
      method: validatedServings.method,
      justification: validatedServings.justification
    },
  };
}

// IMPORTANTE: Esta es una implementación básica usando patrones y regex.
// Para resultados óptimos en producción, se recomienda usar:
// 1. Supabase Edge Functions
// 2. Llamadas a APIs de LLM (OpenAI GPT-4, Anthropic Claude, etc.)
// 3. Modelos de NLP especializados en extracción de recetas
//
// Ejemplo de implementación con Edge Function:
// ```typescript
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { OpenAI } from "https://esm.sh/openai@4.20.1"
//
// serve(async (req) => {
//   const { text } = await req.json()
//   const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
//   
//   const response = await openai.chat.completions.create({
//     model: "gpt-4",
//     messages: [{
//       role: "system",
//       content: "Extract recipe information from text and return structured JSON..."
//     }, {
//       role: "user",
//       content: text
//     }]
//   })
//   
//   return new Response(JSON.stringify(response.choices[0].message.content))
// })
// ```