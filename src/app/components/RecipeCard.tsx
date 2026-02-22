import React from 'react';
import { Recipe } from '../contexts/RecipesContext';
import { Heart, Clock, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onFavoriteToggle: (e: React.MouseEvent) => void;
}

export function RecipeCard({ recipe, onClick, onFavoriteToggle }: RecipeCardProps) {
  const totalTime = recipe.steps.reduce((acc, step) => acc + (step.timerMinutes || 0), 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:shadow-md transition-shadow"
    >
      {recipe.photos && recipe.photos.length > 0 ? (
        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-pink-100 relative">
          <img 
            src={recipe.photos[0]} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
          <span className="text-6xl">🍳</span>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xl font-semibold text-gray-900 flex-1 line-clamp-2">
            {recipe.name}
          </h3>
          <button
            onClick={onFavoriteToggle}
            className="flex-shrink-0 p-2 -mr-2 -mt-1"
          >
            <Heart
              size={24}
              className={recipe.isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-gray-400'}
            />
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{totalTime} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{recipe.servings} pers.</span>
          </div>
        </div>
        
        {recipe.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.categories.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
