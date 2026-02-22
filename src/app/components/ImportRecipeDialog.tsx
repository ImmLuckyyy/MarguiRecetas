import React, { useState, useEffect } from 'react';
import { X, Link2, Loader2, CheckCircle2, AlertCircle, Settings, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import {
  detectPlatform,
  fetchAndParseRecipe,
  checkApiKeysConfigured,
  ParsedRecipe,

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
  const [showConfig, setShowConfig] = useState(false);

  // API keys (se guardan solo en sessionStorage para la sesión actual)
  const [scrapKey, setScrapKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showScrapKey, setShowScrapKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  useEffect(() => {
    // Cargar keys guardadas en sessionStorage
    const savedScrap = sessionStorage.getItem('sc_scrapekey') || '';
    const savedGemini = sessionStorage.getItem('sc_geminikey') || '';
    setScrapKey(savedScrap);
    setGeminiKey(savedGemini);

    const { scrapecreators, gemini } = checkApiKeysConfigured();
    if (!scrapecreators || !gemini) {
      setShowConfig(!savedScrap || !savedGemini);
    }
  }, [isOpen]);

  const saveKeys = () => {
    if (scrapKey) sessionStorage.setItem('sc_scrapekey', scrapKey);
    if (geminiKey) sessionStorage.setItem('sc_geminikey', geminiKey);
    (window as any).__SCRAPECREATORS_KEY__ = scrapKey;
    (window as any).__GEMINI_KEY__ = geminiKey;
    setShowConfig(false);
  };

  const keysReady = (): boolean => {
    const { scrapecreators, gemini } = checkApiKeysConfigured();
    const sessionScrap = sessionStorage.getItem('sc_scrapekey');
    const sessionGemini = sessionStorage.getItem('sc_geminikey');
    return (scrapecreators || !!sessionScrap) && (gemini || !!sessionGemini);
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

    if (!keysReady()) {
      setShowConfig(true);
      setError('Primero configura tus API keys para poder importar recetas.');
      return;
    }

    // Inyectar keys de sesión en el entorno si no vienen del .env
    if (!import.meta.env.VITE_SCRAPECREATORS_API_KEY) {
      const sessionScrap = sessionStorage.getItem('sc_scrapekey') || '';
      const sessionGemini = sessionStorage.getItem('sc_geminikey') || '';
      (window as any).__SCRAPECREATORS_KEY__ = sessionScrap;
      (window as any).__GEMINI_KEY__ = sessionGemini;
    }

    setStatus('loading');
    setError('');

    try {
      const result = await fetchAndParseRecipe(url);

      if (!result.is_recipe || !result.recipe) {
        setError('El contenido no parece contener una receta. Intenta con otro enlace o usa "Normalizar receta".');
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
    const icons: Record<string, string> = { instagram: '📷', tiktok: '🎵', youtube: '📹' };
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Link2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Importar Receta</h2>
              <p className="text-sm text-gray-600">Desde Instagram o TikTok</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              title="Configurar API keys"
            >
              <Settings size={18} className="text-gray-500" />
            </button>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Configuración de API Keys */}
        {showConfig && (
          <div className="mx-6 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-4">
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">⚙️ Configuración de API Keys</p>
              <p className="text-xs text-amber-700">
                Necesitas dos keys para importar recetas. Se guardan solo para esta sesión.
              </p>
            </div>

            {/* ScrapeCreators Key */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ScrapeCreators API Key{' '}
                <a
                  href="https://app.scrapecreators.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  (obtener gratis)
                </a>
              </label>
              <div className="relative">
                <input
                  type={showScrapKey ? 'text' : 'password'}
                  value={scrapKey}
                  onChange={(e) => setScrapKey(e.target.value)}
                  placeholder="sc_..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowScrapKey(!showScrapKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showScrapKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Anthropic Key */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Google Gemini API Key{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  (obtener gratis en Google AI Studio)
                </a>
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700">
                💡 <strong>Alternativa recomendada:</strong> Agrega las keys al archivo <code className="bg-blue-100 px-1 rounded">.env</code> del proyecto para no tener que ingresarlas cada vez:
              </p>
              <pre className="text-xs text-blue-800 mt-1 font-mono bg-blue-100 rounded p-2 overflow-x-auto">
{`VITE_SCRAPECREATORS_API_KEY=sc_...
VITE_GEMINI_API_KEY=AIzaSy...`}
              </pre>
            </div>

            <button
              onClick={saveKeys}
              disabled={!scrapKey || !geminiKey}
              className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Guardar para esta sesión
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del video
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(''); }}
                  placeholder="https://www.tiktok.com/@usuario/video/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Plataformas soportadas:</p>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium flex items-center gap-1.5 border border-gray-100">
                    📷 Instagram
                  </div>
                  <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium flex items-center gap-1.5 border border-gray-100">
                    🎵 TikTok
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Para YouTube, usa el botón "Normalizar receta" y pega el texto de la descripción.
                </p>
              </div>

              {!keysReady() && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    Las API keys no están configuradas. Toca ⚙️ para ingresar tu ScrapeCreators key y tu Gemini key (ambas gratuitas).
                  </p>
                </div>
              )}

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
              <p className="text-sm text-gray-500">Obteniendo datos del video y procesando con IA</p>
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

              <div className="space-y-4">
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

                {parsedRecipe.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedRecipe.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedRecipe.photos.length > 0 && (
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={parsedRecipe.photos[0]}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Ingredientes ({parsedRecipe.ingredients.length})
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
                    {parsedRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2 text-sm">
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-900">
                          {ingredient.quantity && `${ingredient.quantity} `}
                          {ingredient.unit && `${ingredient.unit} `}
                          {ingredient.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setStatus('idle'); setParsedRecipe(null); }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium"
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
                onClick={() => { setStatus('idle'); setError(''); }}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium"
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
