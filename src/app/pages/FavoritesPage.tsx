import React from 'react';
import { useRecipes } from '../contexts/RecipesContext';
import { RecipeCard } from '../components/RecipeCard';
import { Heart } from 'lucide-react';

interface FavoritesPageProps {
  onRecipeClick: (id: string) => void;
}

export function FavoritesPage({ onRecipeClick }: FavoritesPageProps) {
  const { recipes, toggleFavorite } = useRecipes();
  const favoriteRecipes = recipes.filter(recipe => recipe.isFavorite);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Favoritos</h1>
          {favoriteRecipes.length > 0 && (
            <p className="text-gray-600">
              {favoriteRecipes.length} {favoriteRecipes.length === 1 ? 'receta favorita' : 'recetas favoritas'}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {favoriteRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sin favoritos aún
            </h3>
            <p className="text-gray-600">
              Marca tus recetas favoritas tocando el corazón
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {favoriteRecipes.map(recipe => (
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
    </div>
  );
}
