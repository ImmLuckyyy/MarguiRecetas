import React, { useState, useEffect } from 'react';
import { useRecipes, Recipe, Ingredient, Step } from '../contexts/RecipesContext';
import { ArrowLeft, Plus, X, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecipeFormPageProps {
  recipeId?: string;
  onBack: () => void;
}

export function RecipeFormPage({ recipeId, onBack }: RecipeFormPageProps) {
  const { recipes, addRecipe, updateRecipe } = useRecipes();
  const existingRecipe = recipeId ? recipes.find(r => r.id === recipeId) : null;

  const [name, setName] = useState(existingRecipe?.name || '');
  const [description, setDescription] = useState(existingRecipe?.description || '');
  const [servings, setServings] = useState(existingRecipe?.servings || 4);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    existingRecipe?.ingredients || []
  );
  const [steps, setSteps] = useState<Step[]>(
    existingRecipe?.steps || []
  );
  const [categories, setCategories] = useState<string[]>(existingRecipe?.categories || []);
  const [tags, setTags] = useState<string[]>(existingRecipe?.tags || []);
  const [videoUrl, setVideoUrl] = useState(existingRecipe?.videoUrl || '');
  const [photos, setPhotos] = useState<string[]>(existingRecipe?.photos || []);

  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  // Ingredient form
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: '' });

  // Step form
  const [newStep, setNewStep] = useState({ description: '', timerMinutes: '' });

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.quantity) {
      setIngredients([
        ...ingredients,
        {
          id: Date.now().toString(),
          name: newIngredient.name,
          quantity: newIngredient.quantity,
          unit: newIngredient.unit
        }
      ]);
      setNewIngredient({ name: '', quantity: '', unit: '' });
    }
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const addStep = () => {
    if (newStep.description) {
      setSteps([
        ...steps,
        {
          id: Date.now().toString(),
          order: steps.length + 1,
          description: newStep.description,
          timerMinutes: newStep.timerMinutes ? parseInt(newStep.timerMinutes) : undefined
        }
      ]);
      setNewStep({ description: '', timerMinutes: '' });
    }
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id).map((step, index) => ({
      ...step,
      order: index + 1
    })));
  };

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!name || ingredients.length === 0 || steps.length === 0) {
      setShowErrors(true);
      return;
    }

    const recipeData = {
      name,
      description,
      ingredients,
      steps,
      photos,
      videoUrl: videoUrl || undefined,
      categories,
      tags,
      servings,
      isFavorite: existingRecipe?.isFavorite || false
    };

    if (recipeId) {
      updateRecipe(recipeId, recipeData);
    } else {
      addRecipe(recipeData);
    }

    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-500 font-medium"
            >
              <ArrowLeft size={20} />
              <span>Cancelar</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {recipeId ? 'Editar Receta' : 'Nueva Receta'}
            </h1>
            <button
              onClick={handleSubmit}
              className="text-blue-500 font-semibold"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información básica</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la receta *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Pasta Carbonara"
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  showErrors && !name ? 'border-red-500' : 'border-transparent'
                }`}
              />
              {showErrors && !name && (
                <p className="text-red-500 text-sm mt-1">El nombre es obligatorio</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción corta
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Una breve descripción de la receta..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raciones
              </label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del video (opcional)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                YouTube, TikTok o Instagram Reels
              </p>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ingredientes * ({ingredients.length})
          </h2>

          {ingredients.length > 0 && (
            <div className="space-y-2 mb-4">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{ingredient.name}</p>
                    <p className="text-sm text-gray-600">
                      {ingredient.quantity} {ingredient.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeIngredient(ingredient.id)}
                    className="p-2 text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              placeholder="Nombre del ingrediente"
              className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newIngredient.quantity}
                onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                placeholder="Cantidad"
                className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                placeholder="Unidad (g, ml, etc.)"
                className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={addIngredient}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 transition-colors"
            >
              <Plus size={20} className="inline mr-2" />
              Añadir ingrediente
            </button>
          </div>

          {showErrors && ingredients.length === 0 && (
            <p className="text-red-500 text-sm mt-2">Añade al menos un ingrediente</p>
          )}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pasos * ({steps.length})
          </h2>

          {steps.length > 0 && (
            <div className="space-y-3 mb-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex gap-3 p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{step.description}</p>
                    {step.timerMinutes && (
                      <p className="text-sm text-blue-600 mt-1">
                        ⏱ {step.timerMinutes} min
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeStep(step.id)}
                    className="p-2 text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <textarea
              value={newStep.description}
              onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
              placeholder="Describe el paso..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <input
              type="number"
              min="0"
              value={newStep.timerMinutes}
              onChange={(e) => setNewStep({ ...newStep, timerMinutes: e.target.value })}
              placeholder="Temporizador (minutos, opcional)"
              className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addStep}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 transition-colors"
            >
              <Plus size={20} className="inline mr-2" />
              Añadir paso
            </button>
          </div>

          {showErrors && steps.length === 0 && (
            <p className="text-red-500 text-sm mt-2">Añade al menos un paso</p>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h2>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {category}
                  <button onClick={() => removeCategory(category)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              placeholder="Añadir categoría..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCategory}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Etiquetas</h2>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Añadir etiqueta..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addTag}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-semibold text-lg active:bg-blue-600 transition-colors"
        >
          {recipeId ? 'Guardar cambios' : 'Crear receta'}
        </button>
      </div>
    </div>
  );
}
