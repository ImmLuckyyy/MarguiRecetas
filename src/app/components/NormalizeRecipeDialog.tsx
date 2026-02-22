import React, { useState } from 'react';
import { X, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { normalizeRecipeFromTextAsync, NormalizedRecipe } from '../utils/recipeNormalizer';

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

  const hasGemini = !!(
    import.meta.env.VITE_GEMINI_API_KEY ||
    (window as any).__GEMINI_KEY__ ||
    sessionStorage.getItem('sc_geminikey')
  );

  const handleNormalize = async () => {
    if (!inputText.trim() || inputText.length < 30) {
      setError('El texto es demasiado corto. Pega el contenido completo de la receta.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const result = await normalizeRecipeFromTextAsync(inputText);

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

  const handleConfirm = () => {
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

  // ── Helpers de UI ──────────────────────────────────────────────────────────

  const confidenceLabel = (c?: number) => {
    if (!c) return { label: 'Desconocido', color: 'gray' };
    if (c >= 0.8) return { label: 'Alta', color: 'green' };
    if (c >= 0.5) return { label: 'Media', color: 'yellow' };
    return { label: 'Baja', color: 'orange' };
  };

  const servingsConfidenceBadge = (conf?: 'high' | 'medium' | 'low') => {
    const map = {
      high: { label: 'Alta confianza', cls: 'bg-green-100 text-green-700' },
      medium: { label: 'Media', cls: 'bg-yellow-100 text-yellow-700' },
      low: { label: 'Baja', cls: 'bg-orange-100 text-orange-700' },
    };
    return map[conf || 'low'];
  };

  const langFlag: Record<string, string> = {
    es: '🇪🇸', en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹', pt: '🇵🇹',
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
        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Normalizar Receta</h2>
              <p className="text-sm text-gray-500">
                {hasGemini ? '✨ Con Gemini IA' : 'Procesamiento local'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6">

          {/* ── IDLE: formulario ── */}
          {status === 'idle' && (
            <div className="space-y-4">

              {/* Info mode */}
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${hasGemini ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <Info size={16} className={`mt-0.5 flex-shrink-0 ${hasGemini ? 'text-purple-500' : 'text-gray-400'}`} />
                <p className="text-xs text-gray-600">
                  {hasGemini
                    ? 'Gemini 2.0 Flash detectará ingredientes, pasos y estimará las raciones automáticamente.'
                    : 'Modo local: extracción por reglas. Para mejores resultados, configura tu Gemini API Key en el diálogo de Importar.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto de la receta
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setError(''); }}
                  placeholder={`Pega aquí el texto completo de tu receta...

Ejemplo:
Tacos al Pastor

Ingredientes:
- 500g carne de cerdo
- 3 chiles guajillo
- 2 dientes de ajo
- Tortillas de maíz

Preparación:
1. Marinar la carne con los chiles...
2. Cocinar a fuego alto...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[280px] font-mono text-sm resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{inputText.length} caracteres</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              <button
                onClick={handleNormalize}
                disabled={!inputText.trim() || inputText.length < 30}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Normalizar Receta
              </button>
            </div>
          )}

          {/* ── LOADING ── */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-14">
              <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">Procesando receta...</p>
              <p className="text-sm text-gray-500">
                {hasGemini ? 'Analizando con Gemini IA' : 'Extrayendo con reglas locales'}
              </p>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {status === 'preview' && normalizedRecipe && (() => {
            const conf = confidenceLabel(normalizedRecipe.confidence);
            const badge = servingsConfidenceBadge(normalizedRecipe.servingsEstimate?.confidence);
            return (
              <div className="space-y-5">

                {/* Éxito */}
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-800">¡Receta normalizada! Revisa los datos antes de importar</p>
                </div>

                {/* Metadata chips */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Idioma detectado</p>
                    <p className="text-sm font-medium">
                      {langFlag[normalizedRecipe.language || 'es'] || '🌐'} {normalizedRecipe.language?.toUpperCase()}
                    </p>
                  </div>
                  <div className={`bg-${conf.color}-50 rounded-xl p-3`}>
                    <p className="text-xs text-gray-500 mb-0.5">Confianza global</p>
                    <p className={`text-sm font-medium text-${conf.color}-700`}>
                      {conf.label} · {Math.round((normalizedRecipe.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>

                {/* Estimación de raciones */}
                {normalizedRecipe.servingsEstimate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {normalizedRecipe.servings}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {normalizedRecipe.servings} {normalizedRecipe.servings === 1 ? 'porción' : 'porciones'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            · método: {normalizedRecipe.servingsEstimate.method}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{normalizedRecipe.servingsEstimate.justification}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Título y descripción */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{normalizedRecipe.name}</h3>
                  {normalizedRecipe.description && (
                    <p className="text-gray-500 text-sm mt-1">{normalizedRecipe.description}</p>
                  )}
                </div>

                {/* Tiempos */}
                {(normalizedRecipe.prep_time || normalizedRecipe.cook_time || normalizedRecipe.total_time) && (
                  <div className="flex flex-wrap gap-2">
                    {normalizedRecipe.prep_time && (
                      <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm">⏱ Prep: {normalizedRecipe.prep_time}</span>
                    )}
                    {normalizedRecipe.cook_time && (
                      <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">🔥 Cocción: {normalizedRecipe.cook_time}</span>
                    )}
                    {normalizedRecipe.total_time && (
                      <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">⏰ Total: {normalizedRecipe.total_time}</span>
                    )}
                  </div>
                )}

                {/* Tags */}
                {normalizedRecipe.tags && normalizedRecipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {normalizedRecipe.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Ingredientes */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Ingredientes ({normalizedRecipe.ingredients?.length || 0})
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 max-h-44 overflow-y-auto">
                    {normalizedRecipe.ingredients?.map((ing, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-gray-400 flex-shrink-0">•</span>
                        <span className="text-gray-900">
                          {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
                          {ing.unit && <span className="text-gray-600">{ing.unit} </span>}
                          {ing.name}
                          {ing.normalizedGrams && ing.normalizedGrams > 0 && (
                            <span className="text-gray-400 text-xs ml-1">({ing.normalizedGrams.toFixed(0)}g)</span>
                          )}
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
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-52 overflow-y-auto">
                    {normalizedRecipe.instructions?.map((step) => (
                      <div key={step.step} className="flex gap-3">
                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{step.text}</p>
                          {step.timerMinutes && (
                            <p className="text-xs text-purple-600 mt-0.5">⏱ {step.timerMinutes} min</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setStatus('idle'); setNormalizedRecipe(null); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium"
                  >
                    Importar
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── ERROR ── */}
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
                onClick={() => { setStatus('idle'); setError(''); }}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium"
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
