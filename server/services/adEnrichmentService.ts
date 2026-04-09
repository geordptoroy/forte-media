/**
 * Ad Enrichment Service
 * Enriquece anúncios com URLs de CDN extraídas do snapshot
 */

import { extractImageFromSnapshotCached } from './imageProxyService';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

export interface EnrichedAd {
  id: string;
  adId: string;
  pageName: string;
  adSnapshotUrl: string;
  cdnVideoUrl?: string;
  cdnImageUrl?: string;
  cdnThumbnailUrl?: string;
  mediaType?: 'image' | 'video' | 'iframe' | 'placeholder';
  extractionMethod?: string;
  [key: string]: any;
}

/**
 * Enriquece um anúncio com URLs de CDN extraídas
 */
export async function enrichAdWithMedia(ad: any): Promise<EnrichedAd> {
  const cacheKey = `enriched:${ad.id || ad.adId}`;
  const cached = appCache.get<EnrichedAd>(cacheKey);
  
  if (cached) {
    logger.debug('[AdEnrichment] Cache hit', { adId: ad.adId });
    return cached;
  }

  try {
    // Extrair mídia do snapshot
    const extraction = await extractImageFromSnapshotCached(ad.ad_snapshot_url);

    const enriched: EnrichedAd = {
      ...ad,
      id: ad.id || ad.adId,
      adId: ad.adId || ad.id,
      pageName: ad.page_name || ad.pageName,
      adSnapshotUrl: ad.ad_snapshot_url || ad.adSnapshotUrl,
      cdnVideoUrl: extraction.videoUrl,
      cdnImageUrl: extraction.imageUrl,
      cdnThumbnailUrl: extraction.thumbnailUrl,
      mediaType: extraction.mediaType,
      extractionMethod: extraction.extractionMethod,
    };

    // Cache por 24 horas
    appCache.set(cacheKey, enriched, 24 * 60 * 60 * 1000);

    logger.debug('[AdEnrichment] Ad enriquecido', {
      adId: ad.adId,
      mediaType: extraction.mediaType,
      method: extraction.extractionMethod,
    });

    return enriched;
  } catch (error: any) {
    logger.error('[AdEnrichment] Erro ao enriquecer anúncio', {
      adId: ad.adId,
      error: error.message,
    });

    // Retornar ad original mesmo com erro
    return {
      ...ad,
      id: ad.id || ad.adId,
      adId: ad.adId || ad.id,
      pageName: ad.page_name || ad.pageName,
      adSnapshotUrl: ad.ad_snapshot_url || ad.adSnapshotUrl,
    };
  }
}

/**
 * Enriquece múltiplos anúncios em paralelo
 */
export async function enrichAdsWithMedia(ads: any[]): Promise<EnrichedAd[]> {
  const enrichmentPromises = ads.map(ad => enrichAdWithMedia(ad));
  return Promise.all(enrichmentPromises);
}

/**
 * Limpar cache de enriquecimento
 */
export function clearEnrichmentCache(): void {
  appCache.invalidatePattern('^enriched:');
  logger.info('[AdEnrichment] Cache limpo');
}
