// Tabla completa de conversiones de unidades para ingredientes de cocina

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
  category: 'weight' | 'volume' | 'count';
}

export interface IngredientDensity {
  ingredient: string;
  gramsPerCup: number;
  mlPerCup?: number;
}

// Conversiones de peso
export const weightConversions: UnitConversion[] = [
  // Libras a gramos
  { from: 'lb', to: 'g', factor: 453.59237, category: 'weight' },
  { from: 'lbs', to: 'g', factor: 453.59237, category: 'weight' },
  { from: 'libra', to: 'g', factor: 453.59237, category: 'weight' },
  { from: 'libras', to: 'g', factor: 453.59237, category: 'weight' },
  
  // Onzas a gramos
  { from: 'oz', to: 'g', factor: 28.3495, category: 'weight' },
  { from: 'onza', to: 'g', factor: 28.3495, category: 'weight' },
  { from: 'onzas', to: 'g', factor: 28.3495, category: 'weight' },
  
  // Kilogramos a gramos
  { from: 'kg', to: 'g', factor: 1000, category: 'weight' },
  { from: 'kilo', to: 'g', factor: 1000, category: 'weight' },
  { from: 'kilos', to: 'g', factor: 1000, category: 'weight' },
];

// Conversiones de volumen
export const volumeConversions: UnitConversion[] = [
  // Tazas a ml
  { from: 'cup', to: 'ml', factor: 240, category: 'volume' },
  { from: 'cups', to: 'ml', factor: 240, category: 'volume' },
  { from: 'taza', to: 'ml', factor: 240, category: 'volume' },
  { from: 'tazas', to: 'ml', factor: 240, category: 'volume' },
  
  // Cucharadas a ml
  { from: 'tbsp', to: 'ml', factor: 15, category: 'volume' },
  { from: 'tablespoon', to: 'ml', factor: 15, category: 'volume' },
  { from: 'tablespoons', to: 'ml', factor: 15, category: 'volume' },
  { from: 'cda', to: 'ml', factor: 15, category: 'volume' },
  { from: 'cucharada', to: 'ml', factor: 15, category: 'volume' },
  { from: 'cucharadas', to: 'ml', factor: 15, category: 'volume' },
  
  // Cucharaditas a ml
  { from: 'tsp', to: 'ml', factor: 5, category: 'volume' },
  { from: 'teaspoon', to: 'ml', factor: 5, category: 'volume' },
  { from: 'teaspoons', to: 'ml', factor: 5, category: 'volume' },
  { from: 'cdta', to: 'ml', factor: 5, category: 'volume' },
  { from: 'cucharadita', to: 'ml', factor: 5, category: 'volume' },
  { from: 'cucharaditas', to: 'ml', factor: 5, category: 'volume' },
  
  // Litros a ml
  { from: 'l', to: 'ml', factor: 1000, category: 'volume' },
  { from: 'litro', to: 'ml', factor: 1000, category: 'volume' },
  { from: 'litros', to: 'ml', factor: 1000, category: 'volume' },
  
  // Onzas fluidas a ml
  { from: 'fl oz', to: 'ml', factor: 29.5735, category: 'volume' },
  { from: 'fl. oz', to: 'ml', factor: 29.5735, category: 'volume' },
  
  // Pint a ml
  { from: 'pint', to: 'ml', factor: 473.176, category: 'volume' },
  { from: 'pints', to: 'ml', factor: 473.176, category: 'volume' },
  
  // Quart a ml
  { from: 'quart', to: 'ml', factor: 946.353, category: 'volume' },
  { from: 'quarts', to: 'ml', factor: 946.353, category: 'volume' },
  
  // Galón a ml
  { from: 'gallon', to: 'ml', factor: 3785.41, category: 'volume' },
  { from: 'gallons', to: 'ml', factor: 3785.41, category: 'volume' },
];

// Densidades de ingredientes comunes (gramos por taza)
export const ingredientDensities: IngredientDensity[] = [
  // Harinas y granos
  { ingredient: 'harina', gramsPerCup: 120 },
  { ingredient: 'flour', gramsPerCup: 120 },
  { ingredient: 'arroz', gramsPerCup: 185 },
  { ingredient: 'rice', gramsPerCup: 185 },
  { ingredient: 'avena', gramsPerCup: 90 },
  { ingredient: 'oats', gramsPerCup: 90 },
  
  // Azúcares
  { ingredient: 'azúcar', gramsPerCup: 200 },
  { ingredient: 'sugar', gramsPerCup: 200 },
  { ingredient: 'azúcar morena', gramsPerCup: 220 },
  { ingredient: 'brown sugar', gramsPerCup: 220 },
  { ingredient: 'azúcar glass', gramsPerCup: 120 },
  { ingredient: 'powdered sugar', gramsPerCup: 120 },
  
  // Grasas
  { ingredient: 'mantequilla', gramsPerCup: 227 },
  { ingredient: 'butter', gramsPerCup: 227 },
  { ingredient: 'aceite', gramsPerCup: 218, mlPerCup: 240 },
  { ingredient: 'oil', gramsPerCup: 218, mlPerCup: 240 },
  
  // Lácteos
  { ingredient: 'leche', gramsPerCup: 245, mlPerCup: 240 },
  { ingredient: 'milk', gramsPerCup: 245, mlPerCup: 240 },
  { ingredient: 'crema', gramsPerCup: 240, mlPerCup: 240 },
  { ingredient: 'cream', gramsPerCup: 240, mlPerCup: 240 },
  { ingredient: 'yogurt', gramsPerCup: 245 },
  
  // Quesos
  { ingredient: 'queso rallado', gramsPerCup: 100 },
  { ingredient: 'shredded cheese', gramsPerCup: 100 },
  { ingredient: 'queso parmesano', gramsPerCup: 90 },
  { ingredient: 'parmesan', gramsPerCup: 90 },
  
  // Carnes (picadas/molidas)
  { ingredient: 'carne molida', gramsPerCup: 225 },
  { ingredient: 'ground beef', gramsPerCup: 225 },
  { ingredient: 'ground meat', gramsPerCup: 225 },
  { ingredient: 'bacon', gramsPerCup: 140 },
  { ingredient: 'tocino', gramsPerCup: 140 },
  
  // Vegetales
  { ingredient: 'cebolla picada', gramsPerCup: 160 },
  { ingredient: 'chopped onion', gramsPerCup: 160 },
  { ingredient: 'zanahoria rallada', gramsPerCup: 110 },
  { ingredient: 'shredded carrot', gramsPerCup: 110 },
  { ingredient: 'tomate picado', gramsPerCup: 180 },
  { ingredient: 'chopped tomato', gramsPerCup: 180 },
  
  // Líquidos comunes
  { ingredient: 'agua', gramsPerCup: 240, mlPerCup: 240 },
  { ingredient: 'water', gramsPerCup: 240, mlPerCup: 240 },
  { ingredient: 'caldo', gramsPerCup: 240, mlPerCup: 240 },
  { ingredient: 'broth', gramsPerCup: 240, mlPerCup: 240 },
  { ingredient: 'stock', gramsPerCup: 240, mlPerCup: 240 },
  
  // Condimentos
  { ingredient: 'mayonesa', gramsPerCup: 225, mlPerCup: 240 },
  { ingredient: 'mayonnaise', gramsPerCup: 225, mlPerCup: 240 },
  { ingredient: 'ketchup', gramsPerCup: 260, mlPerCup: 240 },
  { ingredient: 'salsa de tomate', gramsPerCup: 260, mlPerCup: 240 },
  { ingredient: 'mostaza', gramsPerCup: 255 },
  { ingredient: 'mustard', gramsPerCup: 255 },
];

// Fracciones comunes
export const fractionMap: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 0.333,
  '⅔': 0.667,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
  '1/2': 0.5,
  '1/4': 0.25,
  '3/4': 0.75,
  '1/3': 0.333,
  '2/3': 0.667,
  '1/8': 0.125,
  '3/8': 0.375,
  '5/8': 0.625,
  '7/8': 0.875,
};

// Sinónimos de unidades
export const unitSynonyms: Record<string, string> = {
  // Count
  'unidad': 'unidades',
  'pieza': 'piezas',
  'piece': 'pieces',
  'pcs': 'pieces',
  'slice': 'slices',
  'rebanada': 'rebanadas',
  'loncha': 'lonchas',
  'strip': 'strips',
  'tira': 'tiras',
  
  // Weight
  'gramo': 'g',
  'gramos': 'g',
  'gram': 'g',
  'grams': 'g',
  'gr': 'g',
  
  // Volume
  'mililitro': 'ml',
  'mililitros': 'ml',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'cc': 'ml',
  
  // Common abbreviations
  'c.': 'cup',
  'T': 'tbsp',
  't': 'tsp',
};

/**
 * Convierte cantidad y unidad a gramos o ml según el ingrediente
 */
export function convertToBaseUnit(
  quantity: number,
  unit: string,
  ingredientName: string
): { value: number; unit: 'g' | 'ml' | 'unidades' } | null {
  const normalizedUnit = unitSynonyms[unit.toLowerCase()] || unit.toLowerCase();
  
  // Buscar conversión de peso
  const weightConv = weightConversions.find(c => c.from === normalizedUnit);
  if (weightConv) {
    return { value: quantity * weightConv.factor, unit: 'g' };
  }
  
  // Buscar conversión de volumen
  const volumeConv = volumeConversions.find(c => c.from === normalizedUnit);
  if (volumeConv) {
    const mlValue = quantity * volumeConv.factor;
    
    // Si es cup/taza, intentar convertir a gramos usando densidad
    if (normalizedUnit.includes('cup') || normalizedUnit.includes('taza')) {
      const density = ingredientDensities.find(d => 
        ingredientName.toLowerCase().includes(d.ingredient.toLowerCase())
      );
      if (density) {
        return { value: quantity * density.gramsPerCup, unit: 'g' };
      }
    }
    
    return { value: mlValue, unit: 'ml' };
  }
  
  // Si es unidad de conteo
  if (['unidades', 'pieces', 'slices', 'rebanadas', 'lonchas', 'strips', 'tiras'].includes(normalizedUnit)) {
    return { value: quantity, unit: 'unidades' };
  }
  
  return null;
}

/**
 * Parsea una cantidad que puede incluir fracciones
 */
export function parseQuantity(quantityStr: string): number | null {
  // Limpiar espacios
  const cleaned = quantityStr.trim();
  
  // Buscar fracciones Unicode o texto
  for (const [fraction, value] of Object.entries(fractionMap)) {
    if (cleaned.includes(fraction)) {
      const rest = cleaned.replace(fraction, '').trim();
      const wholeNumber = rest ? parseFloat(rest) : 0;
      return wholeNumber + value;
    }
  }
  
  // Buscar rangos (2-3, 2 to 3)
  const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    // Usar el valor máximo del rango
    return parseFloat(rangeMatch[2]);
  }
  
  // Número simple
  const number = parseFloat(cleaned);
  return isNaN(number) ? null : number;
}

/**
 * Normaliza un ingrediente con su cantidad y unidad
 */
export function normalizeIngredient(
  quantity: string,
  unit: string,
  name: string
): {
  quantityNormalized: number | null;
  unitNormalized: string;
  baseValue: number | null;
  baseUnit: 'g' | 'ml' | 'unidades' | null;
} {
  const parsedQuantity = parseQuantity(quantity);
  
  if (!parsedQuantity || !unit) {
    return {
      quantityNormalized: parsedQuantity,
      unitNormalized: unit,
      baseValue: null,
      baseUnit: null,
    };
  }
  
  const converted = convertToBaseUnit(parsedQuantity, unit, name);
  
  return {
    quantityNormalized: parsedQuantity,
    unitNormalized: unitSynonyms[unit.toLowerCase()] || unit,
    baseValue: converted?.value || null,
    baseUnit: converted?.unit || null,
  };
}
