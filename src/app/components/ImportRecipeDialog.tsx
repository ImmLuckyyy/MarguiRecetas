import React, { useState } from 'react';
import { X, Link2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  detectPlatform, 
  fetchMetadataFromUrl, 
  parseRecipeFromText,
  ParsedRecipe 
} from '../utils/recipeParser';

interface ImportRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (recipe: ParsedRecipe) => void;
}

type ImportStatus = 'idle' | 'loading' | 'preview' | 'error';

export function ImportRecipeDialog({ isOpen, onClose, onImport }: ImportRecipeDialogProps) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState('');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError('');
  };

  const handleImportUrl = async () => {
    if (!url.trim()) {
      setError('Por favor, ingresa una URL');
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      setError('URL no válida. Solo se aceptan enlaces de Instagram, TikTok o YouTube.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      // Obtener metadatos del contenido
      const metadata = await fetchMetadataFromUrl(url);
      
      if (!metadata) {
        throw new Error('No se pudo obtener información del enlace');
      }

      // Parsear el contenido para extraer la receta
      const result = parseRecipeFromText(
        metadata.description,
        metadata.title,
        url,
        platform
      );

      if (!result.is_recipe || !result.recipe) {
        setError('El contenido no parece contener una receta. Intenta con otro enlace.');
        setStatus('error');
        return;
      }

      setParsedRecipe(result.recipe);
      setStatus('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar la receta');
      setStatus('error');
    }
  };

  const handleConfirmImport = () => {
    if (parsedRecipe) {
      onImport(parsedRecipe);
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setStatus('idle');
    setParsedRecipe(null);
    setError('');
    onClose();
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      tiktok: '🎵',
      youtube: '📹'
    };
    return icons[platform] || '🔗';
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Link2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Importar Receta</h2>
              <p className="text-sm text-gray-600">Desde Instagram, TikTok o YouTube</p>
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
                  URL del contenido
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="https://instagram.com/p/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Plataformas soportadas:</p>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium flex items-center gap-1.5">
                    📷 Instagram
                  </div>
                  <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium flex items-center gap-1.5">
                    🎵 TikTok
                  </div>
                  <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium flex items-center gap-1.5">
                    📹 YouTube
                  </div>
                </div>
              </div>

              <button
                onClick={handleImportUrl}
                disabled={!url.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Importar Receta
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">Importando receta...</p>
              <p className="text-sm text-gray-600">Esto puede tardar unos segundos</p>
            </div>
          )}

          {status === 'preview' && parsedRecipe && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  ¡Receta encontrada! Revisa los datos antes de importar
                </p>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                {/* Título y plataforma */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getPlatformIcon(parsedRecipe.source_platform)}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {parsedRecipe.source_platform}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{parsedRecipe.name}</h3>
                  {parsedRecipe.description && (
                    <p className="text-gray-600 mt-2">{parsedRecipe.description}</p>
                  )}
                </div>

                {/* Tags */}
                {parsedRecipe.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedRecipe.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
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
                    Ingredientes ({parsedRecipe.ingredients.length})
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
                    {parsedRecipe.ingredients.map((ingredient, index) => (
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
                    Pasos ({parsedRecipe.steps.length})
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
                    {parsedRecipe.steps.map((step) => (
                      <div key={step.order} className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {step.order}
                        </div>
                        <p className="text-sm text-gray-900 pt-0.5">{step.description}</p>
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
                    setParsedRecipe(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 transition-colors"
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
                <p className="text-lg font-medium text-gray-900 mb-1">Error al importar</p>
                <p className="text-sm text-gray-600 text-center">{error}</p>
              </div>
              
              <button
                onClick={() => {
                  setStatus('idle');
                  setError('');
                }}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 transition-colors"
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