import React, { useState } from 'react';
import { useRecipes, Recipe } from '../contexts/RecipesContext';
import { ArrowLeft, Heart, Edit, Trash2, Play, ShoppingCart, Users, Plus, Minus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecipeDetailPageProps {
  recipeId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onStartCooking: (id: string) => void;
}

export function RecipeDetailPage({ recipeId, onBack, onEdit, onStartCooking }: RecipeDetailPageProps) {
  const { recipes, toggleFavorite, deleteRecipe, addToShoppingList, adjustServings } = useRecipes();
  const originalRecipe = recipes.find(r => r.id === recipeId);
  const [servings, setServings] = useState(originalRecipe?.servings || 1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');

  if (!originalRecipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Receta no encontrada</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const recipe = adjustServings(originalRecipe, servings);

  const handleDelete = () => {
    deleteRecipe(recipeId);
    onBack();
  };

  const handleAddToList = () => {
    addToShoppingList([recipeId]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header con imagen */}
      <div className="relative">
        {recipe.photos && recipe.photos.length > 0 ? (
          <div className="w-full h-80 bg-gradient-to-br from-orange-100 to-pink-100">
            <img 
              src={recipe.photos[0]} 
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-80 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
            <span className="text-8xl">🍳</span>
          </div>
        )}
        
        {/* Botones de navegación superpuestos */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => toggleFavorite(recipe.id)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Heart
                size={20}
                className={recipe.isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-gray-900'}
              />
            </button>
            <button
              onClick={() => onEdit(recipe.id)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Edit size={18} className="text-gray-900" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-t-3xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{recipe.name}</h1>
          
          {recipe.description && (
            <p className="text-gray-600 text-lg mb-4">{recipe.description}</p>
          )}

          {/* Tags y categorías */}
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.categories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-full font-medium"
              >
                {category}
              </span>
            ))}
            {recipe.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Ajuste de raciones */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <Users size={20} />
                <span className="font-medium">Raciones</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                >
                  <Minus size={16} className="text-gray-700" />
                </button>
                <span className="text-xl font-bold text-gray-900 min-w-[2rem] text-center">
                  {servings}
                </span>
                <button
                  onClick={() => setServings(servings + 1)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                >
                  <Plus size={16} className="text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Video si existe */}
          {recipe.videoUrl && (
            <button
              onClick={() => window.open(recipe.videoUrl, '_blank')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl mb-6 active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <Play size={20} className="text-white ml-0.5" fill="white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Ver video</p>
                  <p className="text-sm text-gray-600">Tutorial paso a paso</p>
                </div>
              </div>
              <ExternalLink size={20} className="text-gray-400" />
            </button>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'ingredients'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Ingredientes
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'steps'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Pasos
            </button>
          </div>

          {/* Contenido de tabs */}
          <AnimatePresence mode="wait">
            {activeTab === 'ingredients' ? (
              <motion.div
                key="ingredients"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {recipe.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <span className="text-gray-900 font-medium">{ingredient.name}</span>
                    <span className="text-gray-600">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="steps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {recipe.steps.map((step) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-lg leading-relaxed">{step.description}</p>
                      {step.timerMinutes && (
                        <p className="text-blue-600 font-medium mt-2">
                          ⏱ {step.timerMinutes} minutos
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button
              onClick={handleAddToList}
              className="flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-900 rounded-2xl font-medium active:bg-gray-200 transition-colors"
            >
              <ShoppingCart size={20} />
              <span>A la lista</span>
            </button>
            <button
              onClick={() => onStartCooking(recipe.id)}
              className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-2xl font-medium active:bg-blue-600 transition-colors"
            >
              <Play size={20} fill="white" />
              <span>Cocinar</span>
            </button>
          </div>

          {/* Botón eliminar */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full mt-4 py-4 text-red-500 font-medium active:text-red-600 transition-colors"
          >
            <Trash2 size={18} className="inline mr-2" />
            Eliminar receta
          </button>
        </div>
      </div>

      {/* Confirmación de eliminación */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 max-w-sm w-[90%] z-50"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar receta?
              </h3>
              <p className="text-gray-600 mb-6">
                Esta acción no se puede deshacer
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-xl font-medium active:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium active:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
