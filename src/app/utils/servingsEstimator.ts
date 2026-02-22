// Sistema de estimación inteligente de raciones basado en heurísticas y anclas

import { parseQuantity, convertToBaseUnit } from './unitConversions';

export interface ServingsEstimate {
  servings: number;
  confidence: 'high' | 'medium' | 'low';
  method: 'explicit' | 'discrete_anchor' | 'mass_based' | 'volume_based' | 'fallback';
  justification: string;
  anchors?: DiscreteAnchor[];
}

export interface DiscreteAnchor {
  type: 'patties' | 'buns' | 'tortillas' | 'slices' | 'pieces' | 'servings';
  count: number;
  ingredientName: string;
}

export interface ParsedIngredient {
  name: string;
  quantity: string;
  unit: string;
}

// Porciones estándar por tipo de alimento (en gramos)
const STANDARD_SERVINGS: Record<string, number> = {
  // Proteínas
  'ground_meat': 113,        // 1/4 lb burger
  'steak': 200,              // filete
  'chicken_breast': 150,     // pechuga
  'fish': 150,               // pescado
  'pork': 150,               // cerdo
  'bacon': 50,               // bacon como principal
  
  // Carbohidratos
  'pasta_dry': 75,           // pasta seca
  'pasta_cooked': 200,       // pasta cocida
  'rice_dry': 75,            // arroz seco
  'rice_cooked': 150,        // arroz cocido
  'potato': 200,             // papas
  
  // Otros
  'eggs': 2,                 // huevos (unidades)
  'bread': 1,                // pan (unidades)
};

// Volumen de salsa/condimento por persona (en ml)
const SAUCE_PER_PERSON = 25; // 1-2 tbsp

/**
 * Encuentra anclas discretas en la lista de ingredientes
 */
function findDiscreteAnchors(
  ingredients: ParsedIngredient[],
  instructions: string[]
): DiscreteAnchor[] {
  const anchors: DiscreteAnchor[] = [];
  
  // Patrones de búsqueda para diferentes tipos de anclas
  const patterns = {
    patties: /(\d+)\s*(hamburguesa|burger|patties|patty|albóndiga|bolita|ball)/gi,
    buns: /(\d+)\s*(pan|bun|bollo|tortilla|wrap|taco)/gi,
    slices: /(\d+)\s*(rebanada|slice|loncha|lámina)/gi,
    pieces: /(\d+)\s*(pieza|piece|porción|portion|serving)/gi,
  };
  
  // Buscar en ingredientes
  for (const ingredient of ingredients) {
    const fullText = `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`.toLowerCase();
    
    // Detectar patties/hamburguesas
    const pattiesMatch = fullText.match(patterns.patties);
    if (pattiesMatch) {
      const count = parseQuantity(ingredient.quantity);
      if (count) {
        anchors.push({
          type: 'patties',
          count,
          ingredientName: ingredient.name
        });
      }
    }
    
    // Detectar panes/buns
    const bunsMatch = fullText.match(patterns.buns);
    if (bunsMatch) {
      const count = parseQuantity(ingredient.quantity);
      if (count) {
        anchors.push({
          type: 'buns',
          count,
          ingredientName: ingredient.name
        });
      }
    }
    
    // Detectar rebanadas
    const slicesMatch = fullText.match(patterns.slices);
    if (slicesMatch) {
      const count = parseQuantity(ingredient.quantity);
      if (count) {
        anchors.push({
          type: 'slices',
          count,
          ingredientName: ingredient.name
        });
      }
    }
  }
  
  // Buscar en instrucciones (ej: "Form into 4 patties")
  const instructionsText = instructions.join(' ').toLowerCase();
  
  // Buscar "form into X balls/patties"
  const formMatch = instructionsText.match(/form(?:\s+(?:into|ground beef into))?\s+(\d+)\s*(ball|patty|patties|hamburguesa)/i);
  if (formMatch) {
    const count = parseInt(formMatch[1]);
    anchors.push({
      type: 'patties',
      count,
      ingredientName: 'formed patties'
    });
  }
  
  // Buscar "divide into X portions"
  const divideMatch = instructionsText.match(/divide(?:\s+into)?\s+(\d+)\s*(portion|porción|serving|parte)/i);
  if (divideMatch) {
    const count = parseInt(divideMatch[1]);
    anchors.push({
      type: 'pieces',
      count,
      ingredientName: 'portions'
    });
  }
  
  return anchors;
}

/**
 * Busca declaraciones explícitas de porciones
 */
function findExplicitServings(
  text: string,
  ingredients: ParsedIngredient[]
): number | null {
  const lowerText = text.toLowerCase();
  
  // Patrones para buscar "Serves X", "Rinde X", "X porciones"
  const patterns = [
    /(?:serves|servings|rinde|raciones|porciones|personas)[:\s]+(\d+(?:\s*-\s*\d+)?)/i,
    /(?:para|for)\s+(\d+)\s+(?:personas|people|servings|porciones)/i,
    /(\d+)\s+(?:personas|people|servings|porciones)/i,
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      // Si es un rango, usar el valor máximo
      const rangeMatch = match[1].match(/(\d+)\s*-\s*(\d+)/);
      if (rangeMatch) {
        return parseInt(rangeMatch[2]);
      }
      return parseInt(match[1]);
    }
  }
  
  // Buscar en ingredientes individuales que digan "X porciones"
  for (const ing of ingredients) {
    const fullText = `${ing.quantity} ${ing.unit} ${ing.name}`.toLowerCase();
    if (fullText.includes('porción') || fullText.includes('serving')) {
      const count = parseQuantity(ing.quantity);
      if (count) return count;
    }
  }
  
  return null;
}

/**
 * Calcula la masa total de la proteína principal
 */
function calculateMainProteinMass(ingredients: ParsedIngredient[]): number | null {
  const proteinKeywords = [
    'carne molida', 'ground beef', 'ground meat', 'carne picada',
    'pollo', 'chicken', 'pechuga',
    'pescado', 'fish', 'salmon', 'salmón', 'atún', 'tuna',
    'cerdo', 'pork', 'lomo',
    'res', 'beef', 'steak',
  ];
  
  for (const ingredient of ingredients) {
    const lowerName = ingredient.name.toLowerCase();
    const isProtein = proteinKeywords.some(keyword => lowerName.includes(keyword));
    
    if (isProtein) {
      const quantity = parseQuantity(ingredient.quantity);
      if (!quantity) continue;
      
      const converted = convertToBaseUnit(quantity, ingredient.unit, ingredient.name);
      if (converted && converted.unit === 'g') {
        return converted.value;
      }
    }
  }
  
  return null;
}

/**
 * Reconcilia múltiples anclas para determinar la más confiable
 */
function reconcileAnchors(anchors: DiscreteAnchor[]): DiscreteAnchor | null {
  if (anchors.length === 0) return null;
  if (anchors.length === 1) return anchors[0];
  
  // Orden de preferencia: patties > buns > pieces > slices
  const preferenceOrder: DiscreteAnchor['type'][] = ['patties', 'buns', 'pieces', 'slices'];
  
  for (const preferredType of preferenceOrder) {
    const anchor = anchors.find(a => a.type === preferredType);
    if (anchor) {
      // Verificar consistencia con otras anclas
      const otherAnchors = anchors.filter(a => a.type !== preferredType);
      const isConsistent = otherAnchors.every(other => 
        Math.abs(other.count - anchor.count) <= 1 // Permitir diferencia de 1
      );
      
      if (isConsistent || otherAnchors.length === 0) {
        return anchor;
      }
    }
  }
  
  // Si no hay consistencia, usar el de mayor confianza (patties)
  return anchors[0];
}

/**
 * Estima el número de porciones de una receta
 */
export function estimateServings(
  ingredients: ParsedIngredient[],
  instructions: string[],
  fullText: string
): ServingsEstimate {
  // 1. Buscar declaración explícita
  const explicitServings = findExplicitServings(fullText, ingredients);
  if (explicitServings) {
    return {
      servings: explicitServings,
      confidence: 'high',
      method: 'explicit',
      justification: `Declaración explícita: ${explicitServings} personas/porciones encontrada en el texto.`
    };
  }
  
  // 2. Buscar anclas discretas
  const anchors = findDiscreteAnchors(ingredients, instructions);
  if (anchors.length > 0) {
    const selectedAnchor = reconcileAnchors(anchors);
    if (selectedAnchor) {
      const consistency = anchors.length > 1 
        ? anchors.every(a => Math.abs(a.count - selectedAnchor.count) <= 1)
        : true;
      
      return {
        servings: selectedAnchor.count,
        confidence: consistency ? 'high' : 'medium',
        method: 'discrete_anchor',
        justification: `Basado en ancla "${selectedAnchor.type}": ${selectedAnchor.count} ${selectedAnchor.ingredientName}. ${
          anchors.length > 1 ? `Confirmado con ${anchors.length} anclas.` : ''
        }`,
        anchors
      };
    }
  }
  
  // 3. Estimación basada en masa de proteína
  const proteinMass = calculateMainProteinMass(ingredients);
  if (proteinMass) {
    const servingSize = STANDARD_SERVINGS['ground_meat']; // 113g por defecto
    const estimated = Math.round(proteinMass / servingSize);
    
    if (estimated >= 1) {
      return {
        servings: estimated,
        confidence: 'medium',
        method: 'mass_based',
        justification: `Estimado por masa de proteína: ${Math.round(proteinMass)}g ÷ ${servingSize}g/persona = ${estimated} porciones.`
      };
    }
  }
  
  // 4. Estimación basada en volumen (para sopas, salsas)
  const sauceVolume = calculateSauceVolume(ingredients);
  if (sauceVolume && sauceVolume > 100) { // Más de 100ml
    const estimated = Math.max(Math.round(sauceVolume / SAUCE_PER_PERSON), 2);
    return {
      servings: estimated,
      confidence: 'low',
      method: 'volume_based',
      justification: `Estimado por volumen de salsa/líquido: ${Math.round(sauceVolume)}ml ÷ ${SAUCE_PER_PERSON}ml/persona ≈ ${estimated} porciones.`
    };
  }
  
  // 5. Fallback
  return {
    servings: 4,
    confidence: 'low',
    method: 'fallback',
    justification: 'Valor por defecto (4 porciones) - no se encontraron indicadores suficientes en la receta.'
  };
}

/**
 * Calcula el volumen total de líquidos/salsas
 */
function calculateSauceVolume(ingredients: ParsedIngredient[]): number | null {
  const liquidKeywords = [
    'mayonesa', 'mayo', 'mayonnaise',
    'salsa', 'sauce',
    'caldo', 'broth', 'stock',
    'agua', 'water',
    'leche', 'milk',
    'crema', 'cream',
    'aceite', 'oil',
  ];
  
  let totalVolume = 0;
  let hasLiquids = false;
  
  for (const ingredient of ingredients) {
    const lowerName = ingredient.name.toLowerCase();
    const isLiquid = liquidKeywords.some(keyword => lowerName.includes(keyword));
    
    if (isLiquid) {
      const quantity = parseQuantity(ingredient.quantity);
      if (!quantity) continue;
      
      const converted = convertToBaseUnit(quantity, ingredient.unit, ingredient.name);
      if (converted && converted.unit === 'ml') {
        totalVolume += converted.value;
        hasLiquids = true;
      }
    }
  }
  
  return hasLiquids ? totalVolume : null;
}

/**
 * Valida que una estimación de porciones sea razonable
 */
export function validateServings(estimate: ServingsEstimate, explicitServings?: number): ServingsEstimate {
  // Si hay porciones explícitas, usarlas con confianza alta
  if (explicitServings && explicitServings > 0) {
    return {
      servings: explicitServings,
      confidence: 'high',
      method: 'explicit',
      justification: `Declaración explícita: ${explicitServings} ${explicitServings === 1 ? 'porción' : 'porciones'} encontrada en el texto.`
    };
  }

  // Límites razonables
  if (estimate.servings < 1) {
    return { ...estimate, servings: 1, confidence: 'low' };
  }
  
  if (estimate.servings > 50) {
    return { 
      ...estimate, 
      servings: 50, 
      confidence: 'low',
      justification: `${estimate.justification} (limitado a máximo 50 porciones)`
    };
  }
  
  return estimate;
}

/**
 * Formatea la estimación para mostrar al usuario
 */
export function formatServingsEstimate(estimate: ServingsEstimate): string {
  const emoji = estimate.confidence === 'high' ? '✅' : estimate.confidence === 'medium' ? '⚠️' : '💡';
  return `${emoji} ${estimate.servings} ${estimate.servings === 1 ? 'porción' : 'porciones'} (${estimate.confidence})`;
}