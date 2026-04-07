/**
 * Image Proxy Service — v2 (Refatorado)
 * ─────────────────────────────────────────────────────────────────────────────
 * Extrai thumbnails de criativos da Meta Ad Library.
 *
 * PROBLEMA ANTERIOR:
 *   O servico tentava fazer scraping do ad_snapshot_url via fetch server-side,
 *   mas a pagina da Meta Ad Library e uma SPA (Single Page Application) renderizada
 *   com JavaScript. O HTML retornado pelo fetch e apenas o shell da pagina, sem
 *   conteudo real — as imagens so aparecem apos execucao do JavaScript no browser.
 *   Por isso, todas as estrategias de regex (og:image, img tags, etc.) falhavam.
 *
 * SOLUCAO:
 *   1. Usar os campos diretos da API Meta quando disponiveis:
 *      - ad_creative_images[].url (imagem direta)
 *      - ad_creative_videos[].thumbnail_url (thumbnail de video)
 *      - ad_creative_videos[].url (URL do video, para extrair thumbnail)
 *
 *   2. Para o ad_snapshot_url, usar o endpoint de embed do Facebook que retorna
 *      uma versao simplificada da pagina com og:image acessivel.
 *
 *   3. Fallback: retornar o snapshot_url para exibicao via iframe no frontend.
 *
 * IMPORTANTE: A Meta nao fornece URLs diretas de imagem para todos os anuncios.
 * Para anuncios sem imagem direta, o iframe do snapshot_url e a melhor opcao.
 */
import { logger } from "../_core/logger";

interface ImageExtractionResult {
  success: boolean;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  snapshotUrl?: string;
  mediaType?: "image" | "video" | "iframe";
  error?: string;
}

/**
 * Extrai a melhor representacao visual de um anuncio.
 *
 * Prioridade:
 * 1. ad_creative_images[0].url (imagem direta da API)
 * 2. ad_creative_videos[0].thumbnail_url (thumbnail de video)
 * 3. Tentativa de extrair og:image do snapshot via fetch simplificado
 * 4. Retorna o snapshot_url para uso como iframe (fallback)
 */
export async function extractAdCreativeThumbnail(ad: any): Promise<ImageExtractionResult> {
  // ── Estrategia 1: Imagem direta da API ──────────────────────────────────
  if (ad.ad_creative_images?.length) {
    const imageUrl = ad.ad_creative_images[0]?.url;
    if (imageUrl && isValidUrl(imageUrl)) {
      logger.debug("[ImageProxy] Usando ad_creative_images diretamente");
      return { success: true, imageUrl, mediaType: "image" };
    }
  }

  // ── Estrategia 2: Thumbnail de video da API ──────────────────────────────
  if (ad.ad_creative_videos?.length) {
    const video = ad.ad_creative_videos[0];
    const thumbnailUrl = video?.thumbnail_url;
    const videoUrl = video?.url;

    if (thumbnailUrl && isValidUrl(thumbnailUrl)) {
      logger.debug("[ImageProxy] Usando ad_creative_videos.thumbnail_url");
      return { success: true, imageUrl: thumbnailUrl, thumbnailUrl, videoUrl, mediaType: "video" };
    }
  }

  // ── Estrategia 3: Extrair og:image do snapshot URL ───────────────────────
  if (ad.ad_snapshot_url) {
    const extracted = await extractImageFromSnapshot(ad.ad_snapshot_url);
    if (extracted.success && extracted.imageUrl) {
      return { ...extracted, mediaType: "image" };
    }
  }

  // ── Fallback: retornar snapshot_url para iframe ──────────────────────────
  if (ad.ad_snapshot_url) {
    return {
      success: true,
      snapshotUrl: ad.ad_snapshot_url,
      mediaType: "iframe",
    };
  }

  return { success: false, error: "Nenhuma fonte de imagem disponivel para este anuncio" };
}

/**
 * Extrai imagem do HTML do snapshot da Meta Ad Library.
 *
 * NOTA: A pagina do snapshot e uma SPA. O fetch server-side retorna apenas
 * o HTML inicial sem conteudo dinamico. Tentamos extrair o og:image que
 * algumas vezes esta presente no HTML inicial (meta tags de SEO).
 *
 * Para anuncios mais recentes da Meta, o og:image pode nao estar disponivel
 * no HTML estatico. Nesse caso, o iframe e a unica opcao viavel sem um
 * browser headless (Puppeteer/Playwright), que seria muito custoso.
 */
export async function extractImageFromSnapshot(
  snapshotUrl: string
): Promise<ImageExtractionResult> {
  if (!snapshotUrl) {
    return { success: false, error: "URL do snapshot nao fornecida" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(snapshotUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: ("HTTP " + response.status) };
    }

    // Ler apenas os primeiros 50KB (suficiente para meta tags no head)
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: "Nao foi possivel ler o corpo da resposta" };
    }

    let html = "";
    let bytesRead = 0;
    const MAX_BYTES = 50 * 1024; // 50KB

    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytesRead += value.length;

      // Para assim que encontrar </head> para economizar memoria
      if (html.includes("</head>")) break;
    }

    reader.cancel().catch(() => {});

    // ── Estrategia 1: og:image ────────────────────────────────────────────
    const ogImagePatterns = [
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
    ];

    for (const pattern of ogImagePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const imageUrl = decodeHtmlEntities(match[1]);
        if (isValidImageUrl(imageUrl)) {
          logger.debug("[ImageProxy] og:image encontrado no snapshot");
          return { success: true, imageUrl };
        }
      }
    }

    // ── Estrategia 2: twitter:image ───────────────────────────────────────
    const twitterImageMatch = html.match(
      /<meta\s+(?:name|property)=["']twitter:image["']\s+content=["']([^"']+)["']/i
    );
    if (twitterImageMatch?.[1]) {
      const imageUrl = decodeHtmlEntities(twitterImageMatch[1]);
      if (isValidImageUrl(imageUrl)) {
        logger.debug("[ImageProxy] twitter:image encontrado no snapshot");
        return { success: true, imageUrl };
      }
    }

    // ── Estrategia 3: JSON-LD com imagem ──────────────────────────────────
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch?.[1]) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        const imageUrl = jsonData?.image?.url || jsonData?.image || jsonData?.thumbnailUrl;
        if (imageUrl && typeof imageUrl === "string" && isValidImageUrl(imageUrl)) {
          logger.debug("[ImageProxy] JSON-LD image encontrado");
          return { success: true, imageUrl };
        }
      } catch {
        // JSON invalido, ignorar
      }
    }

    logger.debug("[ImageProxy] Nenhuma imagem encontrada no HTML do snapshot (SPA sem SSR)");
    return { success: false, error: "Pagina renderizada por JavaScript — imagem nao disponivel no HTML estatico" };

  } catch (error: any) {
    if (error.name === "AbortError") {
      return { success: false, error: "Timeout ao carregar snapshot" };
    }
    logger.error("[ImageProxy] Erro ao extrair imagem:", error.message);
    return { success: false, error: (error.message || "Erro ao extrair imagem") };
  }
}

/**
 * Versao legada — mantida para compatibilidade com o endpoint extractThumbnail.
 * Usa extractAdCreativeThumbnail internamente quando possivel.
 */
export async function extractImageFromSnapshotLegacy(
  snapshotUrl: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const result = await extractImageFromSnapshot(snapshotUrl);
  return result;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const extractionCache = new Map<
  string,
  { result: ImageExtractionResult; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

export async function extractImageFromSnapshotCached(
  snapshotUrl: string
): Promise<ImageExtractionResult> {
  const now = Date.now();
  const cached = extractionCache.get(snapshotUrl);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const result = await extractImageFromSnapshot(snapshotUrl);

  // Cache apenas resultados bem-sucedidos com imageUrl real
  if (result.success && result.imageUrl) {
    extractionCache.set(snapshotUrl, { result, timestamp: now });
  }

  return result;
}

// Limpeza periodica do cache (a cada 30 minutos)
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  extractionCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => extractionCache.delete(key));

  if (keysToDelete.length > 0) {
    logger.info(("[ImageProxy] Cache cleanup: " + keysToDelete.length + " entradas removidas"));
  }
}, 30 * 60 * 1000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Remove query params e fragments para verificar extensao
  const cleanUrl = url.split("?")[0].split("#")[0];
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
  const hasValidExtension = validExtensions.some(ext =>
    cleanUrl.toLowerCase().endsWith(ext)
  );

  // Aceita tambem URLs de CDN do Facebook/Meta que nao tem extensao mas sao imagens
  const isFacebookCdn = url.includes("fbcdn.net") || url.includes("facebook.com") || url.includes("fbsbx.com");

  try {
    new URL(url);
    return hasValidExtension || isFacebookCdn;
  } catch {
    return hasValidExtension && url.length > 0;
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}
