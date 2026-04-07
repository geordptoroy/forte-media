/**
 * Image Proxy Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Extrai imagens do ad_snapshot_url da Meta Ad Library via server-side parsing.
 * Contorna restrições de CORS e retorna URLs de imagem válidas para o frontend.
 */

import { logger } from "../_core/logger";

interface ImageExtractionResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Extrai imagem do HTML da Meta Ad Library
 * Procura por: og:image, img tags, video thumbnails
 */
export async function extractImageFromSnapshot(
  snapshotUrl: string
): Promise<ImageExtractionResult> {
  if (!snapshotUrl) {
    return { success: false, error: "URL do snapshot não fornecida" };
  }

  try {
    // Timeout de 10 segundos para não bloquear requisições
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(snapshotUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // ─── Estratégia 1: og:image meta tag ────────────────────────────────────
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    if (ogImageMatch?.[1]) {
      const imageUrl = ogImageMatch[1];
      if (isValidImageUrl(imageUrl)) {
        return { success: true, imageUrl };
      }
    }

    // ─── Estratégia 2: img tag com src ──────────────────────────────────────
    const imgMatch = html.match(
      /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["']/i
    );
    if (imgMatch?.[1]) {
      const imageUrl = imgMatch[1];
      if (isValidImageUrl(imageUrl)) {
        return { success: true, imageUrl };
      }
    }

    // ─── Estratégia 3: Procura por imagens em script JSON (react hydration) ─
    const jsonMatch = html.match(
      /"(?:image|thumbnail|preview|url)"\s*:\s*"([^"]*\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i
    );
    if (jsonMatch?.[1]) {
      const imageUrl = unescapeJsonString(jsonMatch[1]);
      if (isValidImageUrl(imageUrl)) {
        return { success: true, imageUrl };
      }
    }

    // ─── Estratégia 4: Procura por data-src (lazy loading) ──────────────────
    const dataSrcMatch = html.match(
      /data-src=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["']/i
    );
    if (dataSrcMatch?.[1]) {
      const imageUrl = dataSrcMatch[1];
      if (isValidImageUrl(imageUrl)) {
        return { success: true, imageUrl };
      }
    }

    // ─── Estratégia 5: Procura por srcset ───────────────────────────────────
    const srcsetMatch = html.match(
      /srcset=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)[^"']*)["']/i
    );
    if (srcsetMatch?.[1]) {
      // Pega a primeira URL do srcset
      const firstUrl = srcsetMatch[1].split(",")[0].trim().split(" ")[0];
      if (isValidImageUrl(firstUrl)) {
        return { success: true, imageUrl: firstUrl };
      }
    }

    // ─── Estratégia 6: Procura por background-image CSS ─────────────────────
    const bgImageMatch = html.match(
      /background-image\s*:\s*url\(["']?([^"')]+\.(?:jpg|jpeg|png|webp|gif))[^)]*\)/i
    );
    if (bgImageMatch?.[1]) {
      const imageUrl = bgImageMatch[1];
      if (isValidImageUrl(imageUrl)) {
        return { success: true, imageUrl };
      }
    }

    // ─── Estratégia 7: Procura por picture > source ──────────────────────────
    const pictureMatch = html.match(
      /<picture[^>]*>[\s\S]*?<source[^>]+srcset=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))[^"']*["']/i
    );
    if (pictureMatch?.[1]) {
      const imageUrl = pictureMatch[1];
      if (isValidImageUrl(imageUrl)) {
        return { success: true, imageUrl };
      }
    }

    return { success: false, error: "Nenhuma imagem encontrada no snapshot" };
  } catch (error: any) {
    logger.error("[ImageProxy] Extraction error:", error.message);
    return {
      success: false,
      error: error.message || "Erro ao extrair imagem",
    };
  }
}

/**
 * Valida se uma URL é uma imagem válida
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Remove query params e fragments
  const cleanUrl = url.split("?")[0].split("#")[0];

  // Verifica extensão
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
  const hasValidExtension = validExtensions.some((ext) =>
    cleanUrl.toLowerCase().endsWith(ext)
  );

  // Verifica se é URL válida
  try {
    new URL(cleanUrl);
    return hasValidExtension;
  } catch {
    // Pode ser URL relativa
    return hasValidExtension && cleanUrl.length > 0;
  }
}

/**
 * Unescapa strings JSON
 */
function unescapeJsonString(str: string): string {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

/**
 * Faz cache simples de extrações (em memória, válido por 1 hora)
 */
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

  // Cache apenas resultados bem-sucedidos
  if (result.success) {
    extractionCache.set(snapshotUrl, { result, timestamp: now });
  }

  return result;
}

/**
 * Limpa cache periodicamente (a cada 30 minutos)
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  const keysToDelete: string[] = [];
  extractionCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => {
    extractionCache.delete(key);
    cleaned++;
  });

  if (cleaned > 0) {
    logger.info(`[ImageProxy] Cache cleanup: ${cleaned} entries removed`);
  }
}, 30 * 60 * 1000);
