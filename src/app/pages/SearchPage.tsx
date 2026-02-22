import React, { useState } from 'react';
import { useRecipes } from '../contexts/RecipesContext';
import { RecipeCard } from '../components/RecipeCard';
import { Search as SearchIcon, X } from 'lucide-react';

interface SearchPageProps {
  onRecipeClick: (id: string) => void;
}

export function SearchPage({ onRecipeClick }: SearchPageProps) {
  const { recipes, toggleFavorite, searchRecipes, searchByIngredients } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'name' | 'ingredients'>('name');
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');

  const handleAddIngredient = () => {
    if (currentIngredient.trim() && !ingredientsList.includes(currentIngredient.trim())) {
      setIngredientsList([...ingredientsList, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredientsList(ingredientsList.filter(i => i !== ingredient));
  };

  const results = searchMode === 'name'
    ? searchQuery.trim() ? searchRecipes(searchQuery) : []
    : ingredientsList.length > 0 ? searchByIngredients(ingredientsList) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Buscar</h1>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchMode('name')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'name'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              Por nombre
            </button>
            <button
              onClick={() => setSearchMode('ingredients')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'ingredients'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              Por ingredientes
            </button>
          </div>

          {searchMode === 'name' ? (
            <div className="relative">
              <SearchIcon
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca una receta..."
                className="w-full pl-10 pr-10 py-3 bg-gray-100 border-none rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="relative mb-3">
                <input
                  type="text"
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddIngredient();
                    }
                  }}
                  placeholder="Añade un ingrediente..."
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {currentIngredient && (
                  <button
                    onClick={handleAddIngredient}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg active:bg-blue-600"
                  >
                    Añadir
                  </button>
                )}
              </div>

              {ingredientsList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredientsList.map((ingredient, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {ingredient}
                      <button
                        onClick={() => handleRemoveIngredient(ingredient)}
                        className="ml-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <SearchIcon size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchMode === 'name' && !searchQuery
                ? 'Busca una receta'
                : searchMode === 'ingredients' && ingredientsList.length === 0
                ? 'Añade ingredientes'
                : 'No se encontraron recetas'}
            </h3>
            <p className="text-gray-600">
              {searchMode === 'name'
                ? 'Escribe el nombre de una receta para buscarla'
                : 'Añade los ingredientes que tienes disponibles'}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {results.length} {results.length === 1 ? 'receta encontrada' : 'recetas encontradas'}
            </p>
            <div className="grid grid-cols-1 gap-4">
              {results.map(recipe => (
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
