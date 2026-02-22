import React, { useState } from 'react';
import { useRecipes } from '../contexts/RecipesContext';
import { RecipeCard } from '../components/RecipeCard';
import { Plus, Link2, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { ImportRecipeDialog } from '../components/ImportRecipeDialog';
import { NormalizeRecipeDialog } from '../components/NormalizeRecipeDialog';
import { ParsedRecipe } from '../utils/recipeParser';
import { NormalizedRecipe } from '../utils/recipeNormalizer';
import { toast } from 'sonner';

interface RecipesPageProps {
  onRecipeClick: (id: string) => void;
  onNewRecipe: () => void;
}

export function RecipesPage({ onRecipeClick, onNewRecipe }: RecipesPageProps) {
  const { recipes, toggleFavorite, importRecipeFromParsed, importRecipeFromNormalized } = useRecipes();
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'time'>('recent');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showNormalizeDialog, setShowNormalizeDialog] = useState(false);

  const sortedRecipes = [...recipes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'time':
        const timeA = a.steps.reduce((acc, step) => acc + (step.timerMinutes || 0), 0);
        const timeB = b.steps.reduce((acc, step) => acc + (step.timerMinutes || 0), 0);
        return timeA - timeB;
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleImportRecipe = (recipe: ParsedRecipe) => {
    importRecipeFromParsed(recipe);
    setShowImportDialog(false);
    toast.success('¡Receta importada!', {
      description: `"${recipe.name}" se ha añadido a tu biblioteca`,
    });
  };

  const handleNormalizeRecipe = (recipe: NormalizedRecipe) => {
    importRecipeFromNormalized(recipe);
    setShowNormalizeDialog(false);
    toast.success('¡Receta normalizada!', {
      description: `"${recipe.name}" se ha añadido a tu biblioteca`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mis Recetas</h1>
          
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                sortBy === 'recent'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              Recientes
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                sortBy === 'name'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              A-Z
            </button>
            <button
              onClick={() => setSortBy('time')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                sortBy === 'time'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              Tiempo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {sortedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-5xl">👨‍🍳</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay recetas aún
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza a crear tu biblioteca de recetas favoritas
            </p>
            <button
              onClick={onNewRecipe}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium active:bg-blue-600 transition-colors"
            >
              Crear primera receta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => onRecipeClick(recipe.id)}
                onFavoriteToggle={(e) => {
                  e.stopPropagation();
                  toggleFavorite(recipe.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botones flotantes agrupados en columna sobre la barra de navegación */}
      <div className="fixed bottom-24 right-4 flex flex-col items-center gap-3 z-40">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowNormalizeDialog(true)}
          className="w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg flex items-center justify-center active:bg-purple-600 transition-colors"
          title="Normalizar receta"
        >
          <FileText size={20} strokeWidth={2.5} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowImportDialog(true)}
          className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center active:bg-green-600 transition-colors"
          title="Importar receta"
        >
          <Link2 size={20} strokeWidth={2.5} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onNewRecipe}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-600 transition-colors"
          title="Nueva receta"
        >
          <Plus size={28} strokeWidth={2.5} />
        </motion.button>
      </div>

      <ImportRecipeDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportRecipe}
      />

      <NormalizeRecipeDialog
        isOpen={showNormalizeDialog}
        onClose={() => setShowNormalizeDialog(false)}
        onNormalize={handleNormalizeRecipe}
      />
    </div>
  );
}
