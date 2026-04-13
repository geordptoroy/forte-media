import axios from 'axios';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

/**
 * Meta Ads Service — Simplified
 */

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

function classifyMetaError(error: any): {
  type: 'rate_limit' | 'auth' | 'invalid_input' | 'server_error' | 'unknown';
  retryable: boolean;
  message: string;
} {
  const errorCode = error?.error?.code || error?.code;
  const errorMessage = error?.error?.message || error?.message || '';

  if (errorCode === 429 || [80004, 80006, 80007].includes(errorCode)) {
    return { type: 'rate_limit', retryable: true, message: `Rate limit atingido.` };
  }
  if (errorCode === 401 || [190, 102].includes(errorCode)) {
    return { type: 'auth', retryable: false, message: 'Token inválido ou expirado' };
  }
  if (errorCode === 400 || [2500, 2501].includes(errorCode)) {
    return { type: 'invalid_input', retryable: false, message: `Entrada inválida: ${errorMessage}` };
  }
  if (errorCode === 500 || [1, 2].includes(errorCode)) {
    return { type: 'server_error', retryable: true, message: 'Erro no servidor da Meta.' };
  }
  return { type: 'unknown', retryable: true, message: `Erro desconhecido: ${errorMessage}` };
}

async function requestWithRetry<T>(
  url: string,
  params: Record<string, any>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { params, timeout: 15000 });
      return response.data;
    } catch (error: any) {
      lastError = error;
      const classification = classifyMetaError(error.response?.data);
      if (!classification.retryable || attempt === config.maxRetries) {
        throw new Error(classification.message);
      }
      const delay = Math.min(config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt), config.maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Compatibilidade legada para metaAdLibrary.ts
 */
export async function searchAdsArchive(params: any): Promise<any> {
  const {
    userId,
    accessToken,
    searchTerms,
    searchPageIds,
    adReachedCountries,
    adType,
    adActiveStatus,
    limit,
    after,
  } = params;

  if (searchPageIds && searchPageIds.length > 0) {
    return searchAdsByPages(userId, accessToken, searchPageIds, adReachedCountries, {
      adType,
      adActiveStatus,
      limit,
      after,
    });
  }

  return searchAdsByKeywords(userId, accessToken, searchTerms, adReachedCountries, {
    adType,
    adActiveStatus,
    limit,
    after,
  });
}

/**
 * Buscar anúncios por keywords (API Oficial)
 */
export async function searchAdsByKeywords(
  userId: number,
  accessToken: string,
  keywords: string,
  countries: string[] = ['BR'],
  options: {
    adType?: string;
    adActiveStatus?: string;
    limit?: number;
    after?: string;
  } = {}
): Promise<{ data: any[]; paging?: any }> {
  const cacheKey = `meta:search:${keywords}:${countries.join(',')}:${options.adType}`;
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

  try {
    const result = await requestWithRetry<{ data: any[]; paging?: any }>(
      `${META_GRAPH_URL}/ads_archive`,
      {
        access_token: accessToken,
        search_terms: keywords,
        ad_reached_countries: JSON.stringify(countries),
        ad_active_status: options.adActiveStatus || 'ACTIVE',
        ad_type: options.adType || 'ALL',
        fields: 'id,ad_creative_bodies,ad_snapshot_url,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,ad_creative_link_titles,ad_creative_link_descriptions,currency,spend,impressions',
        limit: options.limit || 50,
        after: options.after,
      }
    );

    appCache.set(cacheKey, result, 30 * 60 * 1000); // 30 min cache
    return result;
  } catch (error: any) {
    logger.error('[MetaAPI] Erro na busca', { keywords, error: error.message });
    throw error;
  }
}

/**
 * Buscar anúncios por IDs de página
 */
export async function searchAdsByPages(
  userId: number,
  accessToken: string,
  pageIds: string[],
  countries: string[] = ['BR'],
  options: {
    adType?: string;
    adActiveStatus?: string;
    limit?: number;
    after?: string;
  } = {}
): Promise<{ data: any[]; paging?: any }> {
  try {
    const result = await requestWithRetry<{ data: any[]; paging?: any }>(
      `${META_GRAPH_URL}/ads_archive`,
      {
        access_token: accessToken,
        publisher_ids: JSON.stringify(pageIds),
        ad_reached_countries: JSON.stringify(countries),
        ad_active_status: options.adActiveStatus || 'ACTIVE',
        ad_type: options.adType || 'ALL',
        fields: 'id,ad_creative_bodies,ad_snapshot_url,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,ad_creative_link_titles,ad_creative_link_descriptions,currency,spend,impressions',
        limit: options.limit || 50,
        after: options.after,
      }
    );
    return result;
  } catch (error: any) {
    logger.error('[MetaAPI] Erro na busca por páginas', { pageIds, error: error.message });
    throw error;
  }
}
