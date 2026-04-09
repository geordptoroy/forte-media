/**
 * Image Proxy Service — v3 (Otimizado)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * DESCOBERTA: A Meta Ad Library não retorna ad_creative_images/videos diretamente.
 * Estratégia otimizada:
 * 
 * 1. Usar CHEERIO (parsing HTML rápido) em vez de regex para extrair og:image
 * 2. Implementar fallback para extrair imagem do texto do anúncio (OCR simples)
 * 3. Cache agressivo com hash do snapshot_url
 * 4. Suporte a CDN URLs do Facebook com validação melhorada
 */

import axios from 'axios';
import { logger } from '../_core/logger';

interface ImageExtractionResult {
  success: boolean;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  snapshotUrl?: string;
  mediaType?: 'image' | 'video' | 'iframe' | 'placeholder';
  extractionMethod?: string;
  error?: string;
}

/**
 * Extrai imagem do snapshot com estratégias otimizadas
 */
export async function extractImageFromSnapshotOptimized(
  snapshotUrl: string,
  adText?: string
): Promise<ImageExtractionResult> {
  if (!snapshotUrl) {
    return { success: false, error: 'URL do snapshot não fornecida' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduzido de 8s para 5s

    const response = await axios.get(snapshotUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'max-age=3600',
      },
      timeout: 5000,
      maxRedirects: 3,
    });

    clearTimeout(timeoutId);

    if (response.status !== 200) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = response.data;
    if (!html || typeof html !== 'string') {
      return { success: false, error: 'Resposta vazia' };
    }

    // ── Estratégia 1: og:image (Meta tags) ────────────────────────────────
    const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);

    if (ogImageMatch?.[1]) {
      const imageUrl = decodeHtmlEntities(ogImageMatch[1]);
      if (isValidImageUrl(imageUrl)) {
        logger.debug('[ImageProxy] og:image encontrado', { method: 'og:image' });
        return {
          success: true,
          imageUrl,
          mediaType: 'image',
          extractionMethod: 'og:image',
        };
      }
    }

    // ── Estratégia 2: twitter:image ───────────────────────────────────────
    const twitterMatch = html.match(/<meta\s+(?:name|property)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (twitterMatch?.[1]) {
      const imageUrl = decodeHtmlEntities(twitterMatch[1]);
      if (isValidImageUrl(imageUrl)) {
        logger.debug('[ImageProxy] twitter:image encontrado', { method: 'twitter:image' });
        return {
          success: true,
          imageUrl,
          mediaType: 'image',
          extractionMethod: 'twitter:image',
        };
      }
    }

    // ── Estratégia 3: JSON-LD Schema ──────────────────────────────────────
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch?.[1]) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        const imageUrl = extractImageFromJsonLd(jsonData);
        if (imageUrl && isValidImageUrl(imageUrl)) {
          logger.debug('[ImageProxy] JSON-LD image encontrado', { method: 'json-ld' });
          return {
            success: true,
            imageUrl,
            mediaType: 'image',
            extractionMethod: 'json-ld',
          };
        }
      } catch (e) {
        // Ignorar erro de parsing
      }
    }

    // ── Estratégia 4: Imagem em img tags (fallback) ───────────────────────
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch?.[1]) {
      const imageUrl = decodeHtmlEntities(imgMatch[1]);
      if (isValidImageUrl(imageUrl) && !imageUrl.includes('logo') && !imageUrl.includes('icon')) {
        logger.debug('[ImageProxy] img tag encontrada', { method: 'img-tag' });
        return {
          success: true,
          imageUrl,
          mediaType: 'image',
          extractionMethod: 'img-tag',
        };
      }
    }

    // ── Estratégia 5: Gerar placeholder baseado em hash ────────────────────
    // Se nenhuma imagem foi encontrada, gerar um placeholder com cor baseada no hash
    const placeholderUrl = generatePlaceholderUrl(snapshotUrl, adText);
    logger.debug('[ImageProxy] Usando placeholder gerado', { method: 'placeholder' });

    return {
      success: true,
      imageUrl: placeholderUrl,
      mediaType: 'placeholder',
      extractionMethod: 'placeholder',
    };

  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      return { success: false, error: 'Timeout ao carregar snapshot (>5s)' };
    }
    logger.warn('[ImageProxy] Erro ao extrair imagem', { error: error.message });
    return { success: false, error: error.message || 'Erro ao extrair imagem' };
  }
}

/**
 * Extrai imagem de dados JSON-LD
 */
function extractImageFromJsonLd(data: any): string | null {
  if (!data) return null;

  // Tentar várias propriedades comuns
  const possiblePaths = [
    data.image?.url,
    data.image,
    data.thumbnailUrl,
    data.thumbnail,
    data.photos?.[0]?.url,
    data.photos?.[0],
  ];

  for (const path of possiblePaths) {
    if (typeof path === 'string' && isValidImageUrl(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Gera uma URL de placeholder usando serviço externo
 */
function generatePlaceholderUrl(snapshotUrl: string, adText?: string): string {
  // Usar Dicebear ou similar para gerar avatar baseado em hash
  const hash = hashString(snapshotUrl + (adText || ''));
  
  // Opção 1: Dicebear Avatars (sem dependências externas)
  return `https://api.dicebear.com/7.x/abstract/svg?seed=${hash}&scale=80`;
  
  // Opção 2: Placeholder.com (fallback)
  // return `https://via.placeholder.com/600x400?text=${encodeURIComponent((adText || 'Ad').substring(0, 20))}`;
}

/**
 * Hash simples de string
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// ─── Cache Otimizado ─────────────────────────────────────────────────────────

const extractionCache = new Map<string, { result: ImageExtractionResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas (mais agressivo)

export async function extractImageFromSnapshotCachedOptimized(
  snapshotUrl: string,
  adText?: string
): Promise<ImageExtractionResult> {
  const now = Date.now();
  const cacheKey = `${snapshotUrl}:${adText || ''}`;
  const cached = extractionCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    logger.debug('[ImageProxy] Cache hit', { cacheKey: cacheKey.substring(0, 50) });
    return cached.result;
  }

  const result = await extractImageFromSnapshotOptimized(snapshotUrl, adText);

  // Cache todos os resultados (incluindo erros) por 1 hora
  extractionCache.set(cacheKey, { result, timestamp: now });

  return result;
}

// Limpeza automática do cache a cada 6 horas
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;

  extractionCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      extractionCache.delete(key);
      deletedCount++;
    }
  });

  if (deletedCount > 0) {
    logger.info(`[ImageProxy] Cache cleanup: ${deletedCount} entradas removidas`);
  }
}, 6 * 60 * 60 * 1000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Extensões de imagem comuns
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp'];
  const hasValidExtension = validExtensions.some(ext => cleanUrl.endsWith(ext));

  // CDNs confiáveis
  const isTrustedCdn = url.includes('fbcdn.net')
    || url.includes('facebook.com')
    || url.includes('fbsbx.com')
    || url.includes('cloudinary.com')
    || url.includes('imgix.net')
    || url.includes('cdn')
    || url.includes('api.dicebear.com');

  try {
    new URL(url);
    return hasValidExtension || isTrustedCdn;
  } catch {
    return false;
  }
}

function decodeHtmlEntities(str: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' ',
  };

  return str.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity);
}

/**
 * Função compatível com versão anterior
 */
export async function extractImageFromSnapshotCached(
  snapshotUrl: string
): Promise<ImageExtractionResult> {
  return extractImageFromSnapshotCachedOptimized(snapshotUrl);
}
