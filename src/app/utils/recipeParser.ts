// Utilidad para parsear recetas desde texto de redes sociales

export interface ParsedRecipe {
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  steps: Array<{
    order: number;
    description: string;
    timerMinutes?: number;
  }>;
  photos: string[];
  videoUrl?: string;
  categories: string[];
  tags: string[];
  servings: number;
  source_url: string;
  source_platform: 'instagram' | 'tiktok' | 'youtube';
}

export interface ParsedRecipeResult {
  is_recipe: boolean;
  recipe?: ParsedRecipe;
  error?: string;
}

// Detectar la plataforma desde la URL
export function detectPlatform(url: string): 'instagram' | 'tiktok' | 'youtube' | null {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
    return 'instagram';
  }
  if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  
  return null;
}

// Limpiar texto de emojis, hashtags y texto promocional
function cleanText(text: string): string {
  // Remover emojis (simplificado)
  let cleaned = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  // Remover hashtags
  cleaned = cleaned.replace(/#\w+/g, '');
  // Remover múltiples espacios y saltos de línea
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// Extraer ingredientes del texto
function extractIngredients(text: string): Array<{ name: string; quantity: string; unit: string }> {
  const ingredients: Array<{ name: string; quantity: string; unit: string }> = [];
  const lines = text.split(/\n|\.(?=\s|$)/);
  
  // Patrones comunes para ingredientes
  const ingredientPatterns = [
    /(?:^|\n)[-•*]\s*(.+)/gi,  // Lista con viñetas
    /(\d+(?:[\.,]\d+)?)\s*(g|kg|ml|l|taza|cucharada|cucharadita|cdta|cda|unidad|unidades|pizca|diente|dientes)?\s+(?:de\s+)?(.+)/gi,
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Buscar patrones de cantidad + ingrediente
    const match = trimmedLine.match(/^(\d+(?:[\.,]\d+)?)\s*(g|kg|ml|l|taza|cucharada|cucharadita|cdta|cda|unidad|unidades|pizca|diente|dientes)?\s+(?:de\s+)?(.+)$/i);
    
    if (match) {
      ingredients.push({
        name: cleanText(match[3] || ''),
        quantity: match[1] || '1',
        unit: match[2] || ''
      });
    } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('*')) {
      // Ingrediente sin cantidad específica
      const ingredientText = trimmedLine.substring(1).trim();
      const quantityMatch = ingredientText.match(/^(\d+(?:[\.,]\d+)?)\s*(g|kg|ml|l|taza|cucharada|cucharadita|cdta|cda|unidad|unidades|pizca|diente|dientes)?\s+(?:de\s+)?(.+)$/i);
      
      if (quantityMatch) {
        ingredients.push({
          name: cleanText(quantityMatch[3] || ''),
          quantity: quantityMatch[1] || '1',
          unit: quantityMatch[2] || ''
        });
      } else {
        ingredients.push({
          name: cleanText(ingredientText),
          quantity: '',
          unit: ''
        });
      }
    }
  }
  
  return ingredients;
}

// Extraer pasos de preparación
function extractInstructions(text: string): Array<{ order: number; description: string; timerMinutes?: number }> {
  const instructions: Array<{ order: number; description: string; timerMinutes?: number }> = [];
  const lines = text.split(/\n/);
  
  let stepNumber = 1;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Buscar pasos numerados o con viñetas
    const numberedMatch = trimmedLine.match(/^(\d+)[.\):-]\s*(.+)/);
    const bulletMatch = trimmedLine.match(/^[-•*]\s*(.+)/);
    
    if (numberedMatch) {
      instructions.push({
        order: parseInt(numberedMatch[1]),
        description: cleanText(numberedMatch[2])
      });
      stepNumber = parseInt(numberedMatch[1]) + 1;
    } else if (bulletMatch) {
      instructions.push({
        order: stepNumber++,
        description: cleanText(bulletMatch[1])
      });
    } else if (trimmedLine.length > 20 && !trimmedLine.includes('http')) {
      // Posible paso sin numeración
      const lowerLine = trimmedLine.toLowerCase();
      const actionWords = ['mezcla', 'añade', 'agrega', 'cocina', 'hierve', 'calienta', 'corta', 'pica', 'bate', 'revuelve', 'sirve', 'coloca', 'vierte'];
      
      if (actionWords.some(word => lowerLine.startsWith(word))) {
        instructions.push({
          order: stepNumber++,
          description: cleanText(trimmedLine)
        });
      }
    }
  }
  
  return instructions;
}

// Extraer tags del texto
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const hashtags = text.match(/#(\w+)/g);
  
  if (hashtags) {
    const relevantTags = hashtags
      .map(tag => tag.substring(1).toLowerCase())
      .filter(tag => !['receta', 'recipe', 'food', 'cooking'].includes(tag))
      .slice(0, 5); // Máximo 5 tags
    
    tags.push(...relevantTags);
  }
  
  // Detectar palabras clave comunes
  const keywords = ['rápido', 'fácil', 'saludable', 'vegetariano', 'vegano', 'sin gluten', 'postre', 'desayuno'];
  const lowerText = text.toLowerCase();
  
  keywords.forEach(keyword => {
    if (lowerText.includes(keyword) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return tags;
}

// Detectar si el texto contiene una receta
function isRecipeContent(text: string): boolean {
  const recipeKeywords = [
    'ingrediente', 'paso', 'preparación', 'cocina', 'mezcla', 'hornea',
    'cucharada', 'taza', 'gramo', 'minuto', 'temperatura', 'receta'
  ];
  
  const lowerText = text.toLowerCase();
  const matchCount = recipeKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Si tiene al menos 3 palabras clave relacionadas con recetas
  return matchCount >= 3;
}

// Parsear el texto completo
export function parseRecipeFromText(
  text: string,
  title: string,
  url: string,
  platform: 'instagram' | 'tiktok' | 'youtube'
): ParsedRecipeResult {
  // Verificar si es contenido de receta
  if (!isRecipeContent(text)) {
    return { is_recipe: false };
  }
  
  // Extraer componentes
  const ingredients = extractIngredients(text);
  const instructions = extractInstructions(text);
  
  // Validar que tenga al menos algunos ingredientes y pasos
  if (ingredients.length === 0 || instructions.length === 0) {
    return { is_recipe: false };
  }
  
  // Extraer descripción (primeras líneas que no sean ingredientes ni pasos)
  const lines = text.split('\n').filter(line => line.trim());
  let description = '';
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    if (!trimmed.match(/^(\d+[.\):-]|[-•*])/)) {
      description += trimmed + ' ';
    }
  }
  
  const recipe: ParsedRecipe = {
    name: title || 'Receta importada',
    description: cleanText(description) || 'Receta importada desde ' + platform,
    ingredients,
    steps: instructions.map((step, index) => ({ ...step, order: index + 1 })),
    photos: [],
    videoUrl: '',
    categories: [],
    tags: extractTags(text),
    servings: 0,
    source_url: url,
    source_platform: platform
  };
  
  return { is_recipe: true, recipe };
}

// SIMULACIÓN: En producción, esto se conectaría a APIs reales
export async function fetchMetadataFromUrl(url: string): Promise<{ title: string; description: string } | null> {
  const platform = detectPlatform(url);
  
  if (!platform) {
    throw new Error('Plataforma no soportada. Solo se aceptan enlaces de Instagram, TikTok o YouTube.');
  }
  
  // IMPORTANTE: Esto es una simulación con datos de ejemplo
  // En producción, necesitarías:
  // 1. Para Instagram: Instagram Basic Display API o web scraping
  // 2. Para TikTok: TikTok API o web scraping
  // 3. Para YouTube: YouTube Data API v3
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Datos de ejemplo según la plataforma
  const mockData = {
    instagram: {
      title: 'Receta de Tacos al Pastor',
      description: `¡Los mejores tacos al pastor! 🌮✨
      
Ingredientes:
- 500g de carne de cerdo
- 3 chiles guajillo
- 2 dientes de ajo
- 1 cucharada de achiote
- 1/2 taza de jugo de naranja
- 1/4 taza de vinagre
- Tortillas de maíz
- Piña
- Cebolla
- Cilantro

Preparación:
1. Hidrata los chiles en agua caliente por 15 minutos
2. Licúa los chiles con ajo, achiote, jugo de naranja y vinagre
3. Marina la carne cortada en tiras con esta salsa por 2 horas
4. Cocina la carne marinada en una sartén hasta dorar
5. Calienta las tortillas
6. Sirve los tacos con piña, cebolla y cilantro picados

#tacos #tacosalpastor #recetamexicana #comidamexicana #recipe`
    },
    tiktok: {
      title: 'Brownies de 3 ingredientes',
      description: `¿Solo 3 ingredientes? ¡Sí! 🍫
      
Ingredientes:
• 200g chocolate negro
• 3 huevos
• 100g azúcar

Pasos:
1- Derrite el chocolate al baño maría
2- Bate los huevos con el azúcar hasta punto letra
3- Mezcla el chocolate derretido con los huevos
4- Vierte en un molde engrasado
5- Hornea a 180°C por 25 minutos
6- Deja enfriar antes de cortar

¡Perfectos para cualquier ocasión! 

#brownies #recetafacil #3ingredientes #postre #chocolate`
    },
    youtube: {
      title: 'Ramen Casero Auténtico',
      description: `Aprende a hacer ramen casero como en Japón 🍜

INGREDIENTES:
Caldo:
- 1kg huesos de cerdo
- 1 cebolla
- 5 dientes de ajo
- Jengibre
- 2L agua

Toppings:
- 200g panceta de cerdo
- 2 huevos
- Cebollín
- Nori
- Brotes de bambú

Fideos:
- 400g fideos ramen

PREPARACIÓN:
1. Hierve los huesos durante 30 minutos y descarta el agua
2. Limpia los huesos y vuelve a hervir con cebolla, ajo y jengibre por 6 horas
3. Cuela el caldo y sazona con sal y salsa de soja
4. Cocina la panceta en rodajas hasta dorar
5. Prepara huevos marinados (hervir 6 minutos y marinar en soja)
6. Cuece los fideos según instrucciones
7. Monta el bowl: fideos, caldo caliente, panceta, huevo y toppings

#ramen #recetajaponesa #comidajaponesa #ramencasero`
    }
  };
  
  return mockData[platform];
}