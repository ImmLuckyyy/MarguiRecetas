import React, { useState } from 'react';
import { useRecipes } from '../contexts/RecipesContext';
import { ShoppingCart, Plus, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ShoppingListPage() {
  const { shoppingList, recipes, toggleShoppingItem, removeFromShoppingList, clearShoppingList, addToShoppingList } = useRecipes();
  const [showAddRecipe, setShowAddRecipe] = useState(false);

  const groupedByRecipe = shoppingList.reduce((acc, item) => {
    if (!acc[item.recipeName]) {
      acc[item.recipeName] = [];
    }
    acc[item.recipeName].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  const uncheckedCount = shoppingList.filter(item => !item.checked).length;
  const checkedCount = shoppingList.filter(item => item.checked).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lista de Compra</h1>
          {shoppingList.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {uncheckedCount} {uncheckedCount === 1 ? 'pendiente' : 'pendientes'}
                {checkedCount > 0 && ` • ${checkedCount} ${checkedCount === 1 ? 'completado' : 'completados'}`}
              </p>
              {shoppingList.length > 0 && (
                <button
                  onClick={clearShoppingList}
                  className="text-red-500 text-sm font-medium active:text-red-600"
                >
                  Limpiar todo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {shoppingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Lista vacía
            </h3>
            <p className="text-gray-600 mb-6">
              Añade recetas para generar tu lista de compra automáticamente
            </p>
            <button
              onClick={() => setShowAddRecipe(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium active:bg-blue-600 transition-colors"
            >
              Añadir desde recetas
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByRecipe).map(([recipeName, items]) => (
              <div key={recipeName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">{recipeName}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <button
                          onClick={() => toggleShoppingItem(item.id)}
                          className="flex-shrink-0"
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            item.checked
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}>
                            {item.checked && <Check size={16} className="text-white" strokeWidth={3} />}
                          </div>
                        </button>
                        <div className="flex-1">
                          <p className={`text-base transition-all ${
                            item.checked ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}>
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromShoppingList(item.id)}
                          className="flex-shrink-0 p-2 text-gray-400 active:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {shoppingList.length > 0 && (
          <button
            onClick={() => setShowAddRecipe(true)}
            className="w-full mt-4 py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 font-medium active:border-blue-500 active:text-blue-500 transition-colors"
          >
            <Plus size={20} className="inline mr-2" />
            Añadir más recetas
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddRecipe && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddRecipe(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden z-50"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Selecciona recetas</h2>
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="p-2 text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-64px)] px-4 py-4">
                {recipes.map(recipe => {
                  const alreadyAdded = shoppingList.some(item => item.recipeId === recipe.id);
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        if (!alreadyAdded) {
                          addToShoppingList([recipe.id]);
                          setShowAddRecipe(false);
                        }
                      }}
                      disabled={alreadyAdded}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl mb-2 transition-colors ${
                        alreadyAdded
                          ? 'bg-gray-100 opacity-50'
                          : 'bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex-shrink-0 flex items-center justify-center">
                        {recipe.photos && recipe.photos.length > 0 ? (
                          <img src={recipe.photos[0]} alt={recipe.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-2xl">🍳</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                        <p className="text-sm text-gray-600">
                          {recipe.ingredients.length} ingredientes
                        </p>
                      </div>
                      {alreadyAdded && (
                        <Check size={20} className="text-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
