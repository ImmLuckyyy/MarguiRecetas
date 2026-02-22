// Utilidad para parsear recetas desde redes sociales
// Usa ScrapeCreators API para obtener metadata y Claude API para parsear la receta

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

// ─── Configuración de API Keys ───────────────────────────────────────────────
// Las keys se leen desde variables de entorno (archivo .env en la raíz del proyecto)
// VITE_SCRAPECREATORS_API_KEY=tu_key_aqui
// VITE_ANTHROPIC_API_KEY=tu_key_aqui

function getScrapCreatorsKey(): string {
  return (
    import.meta.env.VITE_SCRAPECREATORS_API_KEY ||
    (window as any).__SCRAPECREATORS_KEY__ ||
    sessionStorage.getItem('sc_scrapekey') ||
    ''
  );
}

function getAnthropicKey(): string {
  return (
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    (window as any).__ANTHROPIC_KEY__ ||
    sessionStorage.getItem('sc_anthropickey') ||
    ''
  );
}

// ─── Detectar plataforma ─────────────────────────────────────────────────────
export function detectPlatform(url: string): 'instagram' | 'tiktok' | 'youtube' | null {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) return 'instagram';
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  return null;
}

// ─── ScrapeCreators: obtener info del video ──────────────────────────────────

interface VideoMetadata {
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  transcript?: string;
}

async function fetchTikTokMetadata(url: string, apiKey: string): Promise<VideoMetadata> {
  const endpoint = `https://api.scrapecreators.com/v2/tiktok/video?url=${encodeURIComponent(url)}`;

  const response = await fetch(endpoint, {
    headers: { 'x-api-key': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ScrapeCreators TikTok error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const video = data?.data || data;
  const desc = video?.desc || video?.description || '';
  const title = desc.split('\n')[0]?.slice(0, 80) || 'Receta de TikTok';

  return {
    title,
    description: desc,
    thumbnailUrl: video?.video?.cover || video?.cover_uri || '',
    videoUrl: url,
    transcript: video?.transcript || '',
  };
}

async function fetchInstagramMetadata(url: string, apiKey: string): Promise<VideoMetadata> {
  const endpoint = `https://api.scrapecreators.com/v1/instagram/post?url=${encodeURIComponent(url)}`;

  const response = await fetch(endpoint, {
    headers: { 'x-api-key': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ScrapeCreators Instagram error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const post = data?.data || data;
  const caption = post?.caption || post?.edge_media_to_caption?.edges?.[0]?.node?.text || '';
  const title = caption.split('\n')[0]?.slice(0, 80) || 'Receta de Instagram';

  return {
    title,
    description: caption,
    thumbnailUrl: post?.thumbnail_url || post?.display_url || '',
    videoUrl: url,
  };
}

// ─── Claude API: parsear texto a receta estructurada ────────────────────────

async function parseWithClaude(
  metadata: VideoMetadata,
  url: string,
  platform: 'instagram' | 'tiktok' | 'youtube'
): Promise<ParsedRecipeResult> {
  const anthropicKey = getAnthropicKey();
  if (!anthropicKey) {
    throw new Error('Falta la API key de Anthropic. Configura VITE_ANTHROPIC_API_KEY en el archivo .env');
  }

  const textContent = [
    metadata.title,
    metadata.description,
    metadata.transcript ? `Transcripción: ${metadata.transcript}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const prompt = `Analiza el siguiente texto de un video de ${platform} y extrae la receta si existe.

TEXTO DEL VIDEO:
${textContent}

Si el texto contiene una receta, extráela y responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "is_recipe": true,
  "recipe": {
    "name": "nombre de la receta",
    "description": "descripción breve",
    "servings": número de porciones (0 si no se menciona),
    "ingredients": [
      { "name": "ingrediente", "quantity": "cantidad", "unit": "unidad" }
    ],
    "steps": [
      { "order": 1, "description": "descripción del paso", "timerMinutes": null }
    ],
    "tags": ["tag1", "tag2"],
    "categories": ["categoria"]
  }
}

Si el texto NO contiene una receta, responde:
{ "is_recipe": false }

REGLAS:
- quantity debe ser un string con el número (ej: "2", "1/2", "")
- unit puede ser: "g", "kg", "ml", "l", "taza", "cucharada", "cucharadita", "unidad", "pizca", o ""
- timerMinutes es un número si el paso tiene tiempo específico, sino null
- Traduce todo al español si está en otro idioma
- No incluyas texto extra, solo el JSON`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const claudeData = await response.json();
  const rawText = claudeData.content?.[0]?.text || '';
  const cleanJson = rawText.replace(/```json\n?|```\n?/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    throw new Error('No se pudo interpretar la respuesta de Claude. Intenta con otro enlace.');
  }

  if (!parsed.is_recipe || !parsed.recipe) {
    return { is_recipe: false };
  }

  const recipe: ParsedRecipe = {
    name: parsed.recipe.name || 'Receta importada',
    description: parsed.recipe.description || '',
    ingredients: (parsed.recipe.ingredients || []).map((i: any) => ({
      name: i.name || '',
      quantity: String(i.quantity || ''),
      unit: i.unit || '',
    })),
    steps: (parsed.recipe.steps || []).map((s: any, idx: number) => ({
      order: s.order || idx + 1,
      description: s.description || '',
      timerMinutes: s.timerMinutes || undefined,
    })),
    photos: metadata.thumbnailUrl ? [metadata.thumbnailUrl] : [],
    videoUrl: url,
    categories: parsed.recipe.categories || [],
    tags: parsed.recipe.tags || [],
    servings: parsed.recipe.servings || 0,
    source_url: url,
    source_platform: platform,
  };

  return { is_recipe: true, recipe };
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function fetchAndParseRecipe(url: string): Promise<ParsedRecipeResult> {
  const platform = detectPlatform(url);
  if (!platform) {
    throw new Error('URL no válida. Solo se aceptan enlaces de Instagram, TikTok o YouTube.');
  }

  const scrapKey = getScrapCreatorsKey();
  if (!scrapKey) {
    throw new Error('Falta la API key de ScrapeCreators. Configura VITE_SCRAPECREATORS_API_KEY en el archivo .env');
  }

  let metadata: VideoMetadata;

  if (platform === 'tiktok') {
    metadata = await fetchTikTokMetadata(url, scrapKey);
  } else if (platform === 'instagram') {
    metadata = await fetchInstagramMetadata(url, scrapKey);
  } else {
    throw new Error('Para YouTube, usa "Normalizar receta" y pega el texto de la descripción del video manualmente.');
  }

  if (!metadata.description && !metadata.transcript) {
    throw new Error('El video no tiene descripción con texto. Prueba con "Normalizar receta" pegando el contenido manualmente.');
  }

  return parseWithClaude(metadata, url, platform);
}

// ─── Verificar configuración de keys ─────────────────────────────────────────
export function checkApiKeysConfigured(): { scrapecreators: boolean; anthropic: boolean } {
  return {
    scrapecreators: !!getScrapCreatorsKey(),
    anthropic: !!getAnthropicKey(),
  };
}

// Compatibilidad con código existente
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
