import React from 'react';
import { useRecipes } from '../contexts/RecipesContext';
import { RecipeCard } from '../components/RecipeCard';
import { FolderOpen } from 'lucide-react';

interface CategoriesPageProps {
  onRecipeClick: (id: string) => void;
}

export function CategoriesPage({ onRecipeClick }: CategoriesPageProps) {
  const { recipes, getAllCategories, getRecipesByCategory, toggleFavorite } = useRecipes();
  const categories = getAllCategories();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const displayRecipes = selectedCategory
    ? getRecipesByCategory(selectedCategory)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Categorías</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sin categorías
            </h3>
            <p className="text-gray-600">
              Las categorías aparecerán cuando añadas recetas con categorías
            </p>
          </div>
        ) : !selectedCategory ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(category => {
              const count = getRecipesByCategory(category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 active:shadow-md transition-shadow text-left"
                >
                  <div className="text-3xl mb-3">📁</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {category}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {count} {count === 1 ? 'receta' : 'recetas'}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-blue-500 font-medium mb-4 active:text-blue-600"
            >
              ← Volver a categorías
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedCategory}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {displayRecipes.map(recipe => (
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
          </div>
        )}
      </div>
    </div>
  );
}
