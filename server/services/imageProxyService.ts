/**
 * Image Proxy Service — v4 (Final)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Estratégia de Extração de Mídia:
 * 1. Extrair URLs diretas de CDN (fbcdn.net) do HTML renderizado
 * 2. Priorizar: vídeos > posters > imagens > placeholders
 * 3. Validar URLs antes de retornar
 * 4. Cache agressivo com TTL de 24h
 */

import axios from 'axios';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

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
 * Extrai URLs de CDN do HTML renderizado
 * Procura por: <video src="...">, <img src="...">, poster="..."
 */
function extractCdnUrlsFromHtml(html: string): {
  videoUrls: string[];
  imageUrls: string[];
  posterUrls: string[];
} {
  const result = {
    videoUrls: [] as string[],
    imageUrls: [] as string[],
    posterUrls: [] as string[],
  };

  if (!html || typeof html !== 'string') return result;

  // ── Extrair vídeos ─────────────────────────────────────────────────────
  const videoRegex = /<video[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = videoRegex.exec(html)) !== null) {
    const url = decodeHtmlEntities(match[1]);
    if (url.includes('fbcdn.net') && url.includes('.mp4')) {
      result.videoUrls.push(url);
    }
  }

  // ── Extrair posters (thumbnails de vídeo) ──────────────────────────────
  const posterRegex = /poster=["']([^"']+)["']/gi;
  while ((match = posterRegex.exec(html)) !== null) {
    const url = decodeHtmlEntities(match[1]);
    if (url.includes('fbcdn.net') && (url.includes('.jpg') || url.includes('.png'))) {
      result.posterUrls.push(url);
    }
  }

  // ── Extrair imagens (excluindo ícones pequenos) ────────────────────────
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    const url = decodeHtmlEntities(match[1]);
    // Filtrar ícones pequenos (s60x60, s32x32, etc)
    if (url.includes('fbcdn.net') && !url.includes('s60x60') && !url.includes('s32x32')) {
      result.imageUrls.push(url);
    }
  }

  return result;
}

/**
 * Extrai imagem do snapshot com priorização de CDN URLs
 */
export async function extractImageFromSnapshot(
  snapshotUrl: string
): Promise<ImageExtractionResult> {
  if (!snapshotUrl) {
    return { success: false, error: 'URL do snapshot não fornecida' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await axios.get(snapshotUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
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

    // ── Estratégia 1: Extrair URLs diretas de CDN ──────────────────────
    const { videoUrls, imageUrls, posterUrls } = extractCdnUrlsFromHtml(html);

    // Prioridade: Vídeo > Poster > Imagem
    if (videoUrls.length > 0) {
      logger.debug('[ImageProxy] Vídeo CDN encontrado', { method: 'video-cdn' });
      return {
        success: true,
        videoUrl: videoUrls[0],
        thumbnailUrl: posterUrls[0] || undefined,
        mediaType: 'video',
        extractionMethod: 'video-cdn',
      };
    }

    if (posterUrls.length > 0) {
      logger.debug('[ImageProxy] Poster CDN encontrado', { method: 'poster-cdn' });
      return {
        success: true,
        imageUrl: posterUrls[0],
        mediaType: 'image',
        extractionMethod: 'poster-cdn',
      };
    }

    if (imageUrls.length > 0) {
      logger.debug('[ImageProxy] Imagem CDN encontrada', { method: 'image-cdn' });
      return {
        success: true,
        imageUrl: imageUrls[0],
        mediaType: 'image',
        extractionMethod: 'image-cdn',
      };
    }

    // ── Estratégia 2: og:image (Meta tags) ─────────────────────────────
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

    // ── Estratégia 3: JSON-LD Schema ───────────────────────────────────
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

    // ── Fallback: Retornar snapshot para iframe ─────────────────────────
    logger.debug('[ImageProxy] Usando snapshot como iframe', { method: 'iframe-fallback' });
    return {
      success: true,
      snapshotUrl,
      mediaType: 'iframe',
      extractionMethod: 'iframe-fallback',
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

// ─── Cache Otimizado ─────────────────────────────────────────────────────────

const extractionCache = new Map<string, { result: ImageExtractionResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export async function extractImageFromSnapshotCached(
  snapshotUrl: string
): Promise<ImageExtractionResult> {
  const now = Date.now();
  const cached = extractionCache.get(snapshotUrl);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    logger.debug('[ImageProxy] Cache hit', { url: snapshotUrl.substring(0, 50) });
    return cached.result;
  }

  const result = await extractImageFromSnapshot(snapshotUrl);
  extractionCache.set(snapshotUrl, { result, timestamp: now });

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

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp'];
  const hasValidExtension = validExtensions.some(ext => cleanUrl.endsWith(ext));

  const isTrustedCdn = url.includes('fbcdn.net')
    || url.includes('facebook.com')
    || url.includes('fbsbx.com')
    || url.includes('cloudinary.com')
    || url.includes('imgix.net');

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
