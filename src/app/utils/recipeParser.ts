// Utilidad para parsear recetas desde redes sociales
// Usa ScrapeCreators API para obtener metadata y Gemini (gratuito) para parsear la receta

export interface ParsedRecipe {
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  steps: Array<{
    order: number;
    description: string;
    timerMinutes?: number;
  }>;
  photos: string[];
  videoUrl?: string;
  categories: string[];
  tags: string[];
  servings: number;
  source_url: string;
  source_platform: 'instagram' | 'tiktok' | 'youtube';
}

export interface ParsedRecipeResult {
  is_recipe: boolean;
  recipe?: ParsedRecipe;
  error?: string;
}

// ─── API Keys ────────────────────────────────────────────────────────────────
// Opción A (recomendado): agrega en el archivo .env del proyecto:
//   VITE_SCRAPECREATORS_API_KEY=sc_...
//   VITE_GEMINI_API_KEY=AIza...
//
// Opción B: ingrésalas desde la UI (se guardan en sessionStorage)

function getScrapCreatorsKey(): string {
  return (
    import.meta.env.VITE_SCRAPECREATORS_API_KEY ||
    (window as any).__SCRAPECREATORS_KEY__ ||
    sessionStorage.getItem('sc_scrapekey') ||
    ''
  );
}

function getGeminiKey(): string {
  // Priority: sessionStorage (entered via UI) → window var → .env build-time var
  const fromSession = sessionStorage.getItem('sc_geminikey');
  const fromWindow = (window as any).__GEMINI_KEY__;
  const fromEnv = import.meta.env.VITE_GEMINI_API_KEY;
  const key = fromSession || fromWindow || fromEnv || '';
  if (!key) {
    console.warn('[Gemini] No API key found. Set VITE_GEMINI_API_KEY in .env or enter it via UI settings.');
  }
  return key;
}

// ─── Detectar plataforma ─────────────────────────────────────────────────────
export function detectPlatform(url: string): 'instagram' | 'tiktok' | 'youtube' | null {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) return 'instagram';
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  return null;
}

// ─── Verificar configuración ──────────────────────────────────────────────────
export function checkApiKeysConfigured(): { scrapecreators: boolean; gemini: boolean } {
  return {
    scrapecreators: !!getScrapCreatorsKey(),
    gemini: !!getGeminiKey(),
  };
}

// ─── ScrapeCreators: obtener metadata del video ───────────────────────────────

interface VideoMetadata {
  title: string;
  description: string;
  thumbnailUrl?: string;
  transcript?: string;
}

async function fetchTikTokMetadata(url: string, apiKey: string): Promise<VideoMetadata> {
  const endpoint = `https://api.scrapecreators.com/v2/tiktok/video?url=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al obtener el video de TikTok (${response.status}): ${text}`);
  }

  const data = await response.json();
  const video = data?.data || data;
  const desc = video?.desc || video?.description || '';

  return {
    title: desc.split('\n')[0]?.slice(0, 80) || 'Receta de TikTok',
    description: desc,
    thumbnailUrl: video?.video?.cover || video?.cover_uri || '',
    transcript: video?.transcript || '',
  };
}

async function fetchInstagramMetadata(url: string, apiKey: string): Promise<VideoMetadata> {
  const endpoint = `https://api.scrapecreators.com/v1/instagram/post?url=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al obtener el post de Instagram (${response.status}): ${text}`);
  }

  const data = await response.json();
  const post = data?.data || data;
  const caption = post?.caption || post?.edge_media_to_caption?.edges?.[0]?.node?.text || '';

  return {
    title: caption.split('\n')[0]?.slice(0, 80) || 'Receta de Instagram',
    description: caption,
    thumbnailUrl: post?.thumbnail_url || post?.display_url || '',
  };
}

// ─── Gemini API: parsear texto a receta estructurada ─────────────────────────

const RECIPE_PROMPT = (platform: string, text: string) => `
Analiza el siguiente texto de un video de ${platform} y extrae la receta si existe.

TEXTO DEL VIDEO:
${text}

Si el texto contiene una receta, extráela y responde ÚNICAMENTE con JSON válido con esta estructura:
{
  "is_recipe": true,
  "recipe": {
    "name": "nombre de la receta",
    "description": "descripción breve en 1-2 frases",
    "servings": 4,
    "ingredients": [
      { "name": "harina", "quantity": "200", "unit": "g" }
    ],
    "steps": [
      { "order": 1, "description": "descripción del paso", "timerMinutes": null }
    ],
    "tags": ["fácil", "postre"],
    "categories": ["Postres"]
  }
}

Si el texto NO contiene una receta, responde exactamente:
{ "is_recipe": false }

REGLAS IMPORTANTES:
- Responde SOLO con el JSON, sin texto adicional, sin markdown, sin explicaciones
- quantity siempre es string (ej: "200", "1/2", "")
- unit solo puede ser: "g", "kg", "ml", "l", "taza", "cucharada", "cucharadita", "unidad", "pizca", o ""
- timerMinutes es número entero si hay tiempo específico, sino null
- Traduce todo al español
`.trim();

async function parseWithGemini(
  metadata: VideoMetadata,
  url: string,
  platform: 'instagram' | 'tiktok' | 'youtube'
): Promise<ParsedRecipeResult> {
  const geminiKey = getGeminiKey();
  if (!geminiKey) {
    throw new Error('Falta la Gemini API Key. Configúrala en los ajustes o en el archivo .env');
  }

  const textContent = [
    metadata.title,
    metadata.description,
    metadata.transcript ? `Transcripción del audio: ${metadata.transcript}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`;

  console.log('[Gemini] Sending request to:', endpoint.replace(geminiKey, '***'));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: RECIPE_PROMPT(platform, textContent) }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    }),
  });

  console.log('[Gemini] Response status:', response.status);

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Gemini] Error body:', errBody);
    let msg = response.statusText;
    try { msg = JSON.parse(errBody)?.error?.message || msg; } catch {}
    throw new Error(`Gemini API error (${response.status}): ${msg}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Limpiar posibles markdown code fences que Gemini a veces incluye
  const cleanJson = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    throw new Error('Gemini devolvió una respuesta inesperada. Intenta con otro enlace.');
  }

  if (!parsed.is_recipe || !parsed.recipe) {
    return { is_recipe: false };
  }

  const recipe: ParsedRecipe = {
    name: parsed.recipe.name || 'Receta importada',
    description: parsed.recipe.description || '',
    ingredients: (parsed.recipe.ingredients || []).map((i: any) => ({
      name: String(i.name || '').trim(),
      quantity: String(i.quantity ?? ''),
      unit: String(i.unit || ''),
    })),
    steps: (parsed.recipe.steps || []).map((s: any, idx: number) => ({
      order: Number(s.order) || idx + 1,
      description: String(s.description || ''),
      timerMinutes: s.timerMinutes ? Number(s.timerMinutes) : undefined,
    })),
    photos: metadata.thumbnailUrl ? [metadata.thumbnailUrl] : [],
    videoUrl: url,
    categories: parsed.recipe.categories || [],
    tags: parsed.recipe.tags || [],
    servings: Number(parsed.recipe.servings) || 0,
    source_url: url,
    source_platform: platform,
  };

  return { is_recipe: true, recipe };
}

// ─── Función principal exportada ──────────────────────────────────────────────

export async function fetchAndParseRecipe(url: string): Promise<ParsedRecipeResult> {
  const platform = detectPlatform(url);
  if (!platform) {
    throw new Error('URL no válida. Solo se aceptan enlaces de Instagram o TikTok.');
  }

  if (platform === 'youtube') {
    throw new Error('Para YouTube usa "Normalizar receta" y pega el texto de la descripción del video.');
  }

  const scrapKey = getScrapCreatorsKey();
  if (!scrapKey) {
    throw new Error('Falta la ScrapeCreators API Key. Configúrala en los ajustes (⚙️).');
  }

  let metadata: VideoMetadata;
  if (platform === 'tiktok') {
    metadata = await fetchTikTokMetadata(url, scrapKey);
  } else {
    metadata = await fetchInstagramMetadata(url, scrapKey);
  }

  if (!metadata.description && !metadata.transcript) {
    throw new Error(
      'Este video no tiene descripción de texto suficiente. Usa "Normalizar receta" y pega el texto manualmente.'
    );
  }

  return parseWithGemini(metadata, url, platform);
}

// ─── Compatibilidad con código existente ─────────────────────────────────────

export async function fetchMetadataFromUrl(
  _url: string
): Promise<{ title: string; description: string } | null> {
  return null;
}

export function parseRecipeFromText(
  _text: string,
  _title: string,
  _url: string,
  _platform: 'instagram' | 'tiktok' | 'youtube'
): ParsedRecipeResult {
  return { is_recipe: false };
}
