import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ParsedRecipe } from '../utils/recipeParser';
import { NormalizedRecipe } from '../utils/recipeNormalizer';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  photos: string[];
  videoUrl?: string;
  categories: string[];
  tags: string[];
  servings: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  timerMinutes?: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  recipeId: string;
  recipeName: string;
  checked: boolean;
}

interface RecipesContextType {
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addToShoppingList: (recipeIds: string[]) => void;
  removeFromShoppingList: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  clearShoppingList: () => void;
  searchRecipes: (query: string) => Recipe[];
  searchByIngredients: (ingredients: string[]) => Recipe[];
  getRecipesByCategory: (category: string) => Recipe[];
  getAllCategories: () => string[];
  getAllTags: () => string[];
  adjustServings: (recipe: Recipe, newServings: number) => Recipe;
  importRecipeFromParsed: (parsedRecipe: ParsedRecipe) => void;
  importRecipeFromNormalized: (normalizedRecipe: NormalizedRecipe) => void;
}

const RecipesContext = createContext<RecipesContextType | undefined>(undefined);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const storedRecipes = localStorage.getItem('recipes');
    const storedShoppingList = localStorage.getItem('shoppingList');
    
    if (storedRecipes) {
      setRecipes(JSON.parse(storedRecipes));
    } else {
      // Datos de ejemplo para onboarding
      const exampleRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Pasta Carbonara',
          description: 'Clásica receta italiana con huevo y panceta',
          ingredients: [
            { id: '1', name: 'Espaguetis', quantity: '400', unit: 'g' },
            { id: '2', name: 'Panceta', quantity: '200', unit: 'g' },
            { id: '3', name: 'Huevos', quantity: '4', unit: 'unidades' },
            { id: '4', name: 'Queso parmesano', quantity: '100', unit: 'g' },
            { id: '5', name: 'Pimienta negra', quantity: '1', unit: 'cucharadita' }
          ],
          steps: [
            { id: '1', order: 1, description: 'Hierve abundante agua con sal para la pasta', timerMinutes: 10 },
            { id: '2', order: 2, description: 'Corta la panceta en dados y dórala en una sartén sin aceite' },
            { id: '3', order: 3, description: 'Bate los huevos con el queso parmesano rallado y pimienta' },
            { id: '4', order: 4, description: 'Cuece la pasta según las instrucciones del paquete', timerMinutes: 8 },
            { id: '5', order: 5, description: 'Escurre la pasta y mézclala con la panceta. Aparta del fuego' },
            { id: '6', order: 6, description: 'Añade la mezcla de huevo y queso, removiendo rápidamente. El calor residual cocinará el huevo' }
          ],
          photos: [],
          categories: ['Pasta', 'Italiana'],
          tags: ['rápido', 'tradicional'],
          servings: 4,
          isFavorite: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Ensalada César',
          description: 'Ensalada fresca con pollo y aderezo césar casero',
          ingredients: [
            { id: '1', name: 'Lechuga romana', quantity: '2', unit: 'unidades' },
            { id: '2', name: 'Pechuga de pollo', quantity: '300', unit: 'g' },
            { id: '3', name: 'Pan', quantity: '100', unit: 'g' },
            { id: '4', name: 'Queso parmesano', quantity: '50', unit: 'g' },
            { id: '5', name: 'Mayonesa', quantity: '3', unit: 'cucharadas' },
            { id: '6', name: 'Ajo', quantity: '1', unit: 'diente' },
            { id: '7', name: 'Limón', quantity: '1', unit: 'unidad' }
          ],
          steps: [
            { id: '1', order: 1, description: 'Sazona y cocina la pechuga de pollo a la plancha', timerMinutes: 8 },
            { id: '2', order: 2, description: 'Corta el pan en cubos y tuéstalos en el horno hasta que estén crujientes', timerMinutes: 10 },
            { id: '3', order: 3, description: 'Prepara el aderezo mezclando mayonesa, ajo picado, jugo de limón y queso rallado' },
            { id: '4', order: 4, description: 'Lava y corta la lechuga en trozos grandes' },
            { id: '5', order: 5, description: 'Corta el pollo en tiras' },
            { id: '6', order: 6, description: 'Mezcla todo en un bowl grande, añade el aderezo y los crutones justo antes de servir' }
          ],
          photos: [],
          categories: ['Ensaladas', 'Saludable'],
          tags: ['ligero', 'proteína'],
          servings: 2,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setRecipes(exampleRecipes);
    }
    
    if (storedShoppingList) {
      setShoppingList(JSON.parse(storedShoppingList));
    }
  }, []);

  // Guardar en localStorage cuando cambien los datos
  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  const addRecipe = (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRecipes([...recipes, newRecipe]);
  };

  const updateRecipe = (id: string, updatedData: Partial<Recipe>) => {
    setRecipes(recipes.map(recipe => 
      recipe.id === id 
        ? { ...recipe, ...updatedData, updatedAt: new Date().toISOString() }
        : recipe
    ));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(recipes.filter(recipe => recipe.id !== id));
    setShoppingList(shoppingList.filter(item => item.recipeId !== id));
  };

  const toggleFavorite = (id: string) => {
    setRecipes(recipes.map(recipe =>
      recipe.id === id ? { ...recipe, isFavorite: !recipe.isFavorite } : recipe
    ));
  };

  const addToShoppingList = (recipeIds: string[]) => {
    const newItems: ShoppingItem[] = [];
    
    recipeIds.forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ingredient => {
          // Comprobar si el ingrediente ya está en la lista
          const existingItem = shoppingList.find(
            item => item.name.toLowerCase() === ingredient.name.toLowerCase() && item.recipeId === recipeId
          );
          
          if (!existingItem) {
            newItems.push({
              id: `${recipeId}-${ingredient.id}-${Date.now()}`,
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              recipeId: recipeId,
              recipeName: recipe.name,
              checked: false
            });
          }
        });
      }
    });
    
    setShoppingList([...shoppingList, ...newItems]);
  };

  const removeFromShoppingList = (id: string) => {
    setShoppingList(shoppingList.filter(item => item.id !== id));
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };

  const searchRecipes = (query: string): Recipe[] => {
    const lowerQuery = query.toLowerCase();
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      recipe.categories.some(cat => cat.toLowerCase().includes(lowerQuery))
    );
  };

  const searchByIngredients = (ingredients: string[]): Recipe[] => {
    const lowerIngredients = ingredients.map(i => i.toLowerCase());
    return recipes.filter(recipe =>
      lowerIngredients.some(searchIng =>
        recipe.ingredients.some(recipeIng =>
          recipeIng.name.toLowerCase().includes(searchIng)
        )
      )
    );
  };

  const getRecipesByCategory = (category: string): Recipe[] => {
    return recipes.filter(recipe =>
      recipe.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
    );
  };

  const getAllCategories = (): string[] => {
    const categories = new Set<string>();
    recipes.forEach(recipe => {
      recipe.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  };

  const getAllTags = (): string[] => {
    const tags = new Set<string>();
    recipes.forEach(recipe => {
      recipe.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  const adjustServings = (recipe: Recipe, newServings: number): Recipe => {
    const ratio = newServings / recipe.servings;
    return {
      ...recipe,
      servings: newServings,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        quantity: (parseFloat(ing.quantity) * ratio).toFixed(1)
      }))
    };
  };

  const importRecipeFromParsed = (parsedRecipe: ParsedRecipe) => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: parsedRecipe.name,
      description: parsedRecipe.description,
      ingredients: parsedRecipe.ingredients.map((ing, index) => ({
        id: index.toString(),
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      })),
      steps: parsedRecipe.steps.map((step, index) => ({
        id: index.toString(),
        order: index + 1,
        description: step.description,
        timerMinutes: step.timerMinutes
      })),
      photos: parsedRecipe.photos,
      videoUrl: parsedRecipe.videoUrl,
      categories: parsedRecipe.categories,
      tags: parsedRecipe.tags,
      servings: parsedRecipe.servings,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRecipes([...recipes, newRecipe]);
  };

  const importRecipeFromNormalized = (normalizedRecipe: NormalizedRecipe) => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: normalizedRecipe.name || 'Receta importada',
      description: normalizedRecipe.description || '',
      ingredients: (normalizedRecipe.ingredients || []).map((ing, index) => ({
        id: index.toString(),
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      })),
      steps: (normalizedRecipe.instructions || []).map((inst, index) => ({
        id: index.toString(),
        order: inst.step,
        description: inst.text
      })),
      photos: normalizedRecipe.photos || [],
      videoUrl: normalizedRecipe.videoUrl,
      categories: normalizedRecipe.categories || [],
      tags: normalizedRecipe.tags || [],
      servings: normalizedRecipe.servings || 4,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRecipes([...recipes, newRecipe]);
  };

  return (
    <RecipesContext.Provider
      value={{
        recipes,
        shoppingList,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        addToShoppingList,
        removeFromShoppingList,
        toggleShoppingItem,
        clearShoppingList,
        searchRecipes,
        searchByIngredients,
        getRecipesByCategory,
        getAllCategories,
        getAllTags,
        adjustServings,
        importRecipeFromParsed,
        importRecipeFromNormalized
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (!context) {
    throw new Error('useRecipes must be used within RecipesProvider');
  }
  return context;
}