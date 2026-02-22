import React, { useState } from 'react';
import { X, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { normalizeRecipeFromText, NormalizedRecipe } from '../utils/recipeNormalizer';

interface NormalizeRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNormalize: (recipe: NormalizedRecipe) => void;
}

type NormalizeStatus = 'idle' | 'loading' | 'preview' | 'error';

export function NormalizeRecipeDialog({ isOpen, onClose, onNormalize }: NormalizeRecipeDialogProps) {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<NormalizeStatus>('idle');
  const [normalizedRecipe, setNormalizedRecipe] = useState<NormalizedRecipe | null>(null);
  const [error, setError] = useState('');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setError('');
  };

  const handleNormalizeText = async () => {
    if (!inputText.trim()) {
      setError('Por favor, pega el texto de la receta');
      return;
    }

    setStatus('loading');
    setError('');

    // Simular procesamiento (en producción sería una llamada a API/Edge Function)
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const result = normalizeRecipeFromText(inputText);

      if (!result.is_recipe) {
        setError('El texto no parece contener una receta válida. Asegúrate de incluir ingredientes y pasos.');
        setStatus('error');
        return;
      }

      setNormalizedRecipe(result);
      setStatus('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la receta');
      setStatus('error');
    }
  };

  const handleConfirmNormalize = () => {
    if (normalizedRecipe) {
      onNormalize(normalizedRecipe);
      handleClose();
    }
  };

  const handleClose = () => {
    setInputText('');
    setStatus('idle');
    setNormalizedRecipe(null);
    setError('');
    onClose();
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'gray';
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.5) return 'yellow';
    return 'orange';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Desconocido';
    if (confidence >= 0.8) return 'Alta confianza';
    if (confidence >= 0.5) return 'Media confianza';
    return 'Baja confianza';
  };

  const getLanguageName = (code?: string) => {
    const languages: Record<string, string> = {
      es: '🇪🇸 Español',
      en: '🇬🇧 English',
      fr: '🇫🇷 Français',
      it: '🇮🇹 Italiano',
      pt: '🇵🇹 Português',
    };
    return languages[code || 'es'] || code;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Normalizar Receta</h2>
              <p className="text-sm text-gray-600">Desde texto libre en cualquier idioma</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto de la receta
                </label>
                <textarea
                  value={inputText}
                  onChange={handleTextChange}
                  placeholder="Pega aquí el texto completo de tu receta...

Ejemplo:
Tacos al Pastor

Ingredientes:
- 500g carne de cerdo
- 3 chiles guajillo
- Tortillas de maíz
...

Preparación:
1. Marinar la carne...
2. Cocinar a fuego alto..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {inputText.length} caracteres
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle size={20} className="text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Sparkles size={20} className="text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      IA de normalización
                    </p>
                    <p className="text-xs text-gray-600">
                      El sistema detectará automáticamente el idioma, extraerá ingredientes y pasos,
                      y estructurará la receta. Funciona con español, inglés, francés, italiano y portugués.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNormalizeText}
                disabled={!inputText.trim() || inputText.length < 50}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium active:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Normalizar Receta
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">Procesando receta...</p>
              <p className="text-sm text-gray-600">Extrayendo y estructurando información</p>
            </div>
          )}

          {status === 'preview' && normalizedRecipe && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  ¡Receta normalizada! Revisa los datos extraídos
                </p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Idioma</p>
                  <p className="text-sm font-medium">{getLanguageName(normalizedRecipe.language)}</p>
                </div>
                <div className={`bg-${getConfidenceColor(normalizedRecipe.confidence)}-50 rounded-xl p-3`}>
                  <p className="text-xs text-gray-600 mb-1">Confianza</p>
                  <p className={`text-sm font-medium text-${getConfidenceColor(normalizedRecipe.confidence)}-700`}>
                    {getConfidenceLabel(normalizedRecipe.confidence)} ({Math.round((normalizedRecipe.confidence || 0) * 100)}%)
                  </p>
                </div>
              </div>

              {/* Servings Estimate */}
              {normalizedRecipe.servingsEstimate && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {normalizedRecipe.servings}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {normalizedRecipe.servings} {normalizedRecipe.servings === 1 ? 'porción' : 'porciones'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          normalizedRecipe.servingsEstimate.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          normalizedRecipe.servingsEstimate.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {normalizedRecipe.servingsEstimate.confidence === 'high' ? 'Alta confianza' :
                           normalizedRecipe.servingsEstimate.confidence === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{normalizedRecipe.servingsEstimate.justification}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{normalizedRecipe.name}</h3>
                  {normalizedRecipe.description && (
                    <p className="text-gray-600 mt-2">{normalizedRecipe.description}</p>
                  )}
                </div>

                {/* Info adicional */}
                {(normalizedRecipe.servings || normalizedRecipe.prep_time || normalizedRecipe.cook_time || normalizedRecipe.total_time) && (
                  <div className="flex flex-wrap gap-2">
                    {normalizedRecipe.servings && (
                      <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        👥 {normalizedRecipe.servings} porciones
                      </div>
                    )}
                    {normalizedRecipe.prep_time && (
                      <div className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm">
                        ⏱️ Prep: {normalizedRecipe.prep_time}
                      </div>
                    )}
                    {normalizedRecipe.cook_time && (
                      <div className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
                        🔥 Cocción: {normalizedRecipe.cook_time}
                      </div>
                    )}
                    {normalizedRecipe.total_time && (
                      <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                        ⏰ Total: {normalizedRecipe.total_time}
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {normalizedRecipe.tags && normalizedRecipe.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Etiquetas detectadas</p>
                    <div className="flex flex-wrap gap-2">
                      {normalizedRecipe.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingredientes */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Ingredientes ({normalizedRecipe.ingredients?.length || 0})
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
                    {normalizedRecipe.ingredients?.map((ingredient, index) => (
                      <div key={index} className="flex gap-2 text-sm">
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-900">
                          {ingredient.quantity && `${ingredient.quantity} `}
                          {ingredient.unit && `${ingredient.unit} `}
                          {ingredient.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pasos */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Pasos ({normalizedRecipe.instructions?.length || 0})
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
                    {normalizedRecipe.instructions?.map((instruction) => (
                      <div key={instruction.step} className="flex gap-3">
                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {instruction.step}
                        </div>
                        <p className="text-sm text-gray-900 pt-0.5">{instruction.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setStatus('idle');
                    setNormalizedRecipe(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmNormalize}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium active:bg-purple-600 transition-colors"
                >
                  Importar
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">Error al procesar</p>
                <p className="text-sm text-gray-600 text-center">{error}</p>
              </div>
              
              <button
                onClick={() => {
                  setStatus('idle');
                  setError('');
                }}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium active:bg-purple-600 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}