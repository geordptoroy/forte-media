import axios from 'axios';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

/**
 * Meta Ads Service — Enhanced to capture all available data
 */

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0/ads_archive';

// Token temporário fornecido pelo usuário para testes
const TEMP_ACCESS_TOKEN = "EAAMuA4Ly8N0BRIi2Saek93TUvuhqBM7g0MST6eVojAk0picNTzwlP8zWTcqw6TlNbgQ3lYPuw0ymJOfQ1Ax2q8otACXKktvcGsJZCVy9F5kDZB4WzqIWjyyNqNZBoYpDMKkl6ZAoV4gqAZBlfh42yzvFsMSuWrvQ9zCnUUwmuqlRK2yY7J72FMoVXn9WkaRnpLaCdJUZCZBMMfpY8yb5y3RVF4nZAaYrH4BRLs2vlhRaeuejPYZBzknljhzCee1Pol6JZB0AQ53ljMpZCvPsnA2S29IkSG7ggcuZAqx110oZD";

// Lista exaustiva de campos para capturar o máximo de inteligência competitiva
const META_ADS_FIELDS = [
  'id',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'ad_snapshot_url',
  'currency',
  'delivery_by_region',
  'demographic_distribution',
  'impressions',
  'languages',
  'page_id',
  'page_name',
  'publisher_platforms',
  'spend',
  'target_locations',
  'target_ages',
  'target_gender',
  'age_country_gender_reach_breakdown',
  'estimated_audience_size'
].join(',');

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
      const response = await axios.get(url, { params, timeout: 20000 });
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

  // Se o token for o placeholder ou vazio, usa o token temporário de teste
  const effectiveToken = (!accessToken || accessToken.includes("YOUR_") || accessToken.length < 20) 
    ? TEMP_ACCESS_TOKEN 
    : accessToken;

  if (searchPageIds && searchPageIds.length > 0) {
    return searchAdsByPages(userId, effectiveToken, searchPageIds, adReachedCountries, {
      adType,
      adActiveStatus,
      limit,
      after,
    });
  }

  return searchAdsByKeywords(userId, effectiveToken, searchTerms, adReachedCountries, {
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
  const cacheKey = `meta:search:${keywords}:${countries.join(',')}:${options.adType}:${options.after || 'start'}`;
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

  const effectiveToken = (!accessToken || accessToken.includes("YOUR_") || accessToken.length < 20) 
    ? TEMP_ACCESS_TOKEN 
    : accessToken;

  try {
    const result = await requestWithRetry<{ data: any[]; paging?: any }>(
      `${META_GRAPH_URL}`,
      {
        access_token: effectiveToken,
        search_terms: keywords,
        ad_reached_countries: JSON.stringify(countries),
        ad_active_status: options.adActiveStatus || 'ACTIVE',
        ad_type: options.adType || 'ALL',
        fields: META_ADS_FIELDS,
        limit: options.limit || 50,
        after: options.after,
      }
    );

    appCache.set(cacheKey, result, 30 * 60 * 1000); // 30 min cache
    return result;
  } catch (error: any) {
    logger.error('[MetaAPI] Erro na busca por keywords', { keywords, error: error.message });
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
  const effectiveToken = (!accessToken || accessToken.includes("YOUR_") || accessToken.length < 20) 
    ? TEMP_ACCESS_TOKEN 
    : accessToken;

  try {
    const result = await requestWithRetry<{ data: any[]; paging?: any }>(
      `${META_GRAPH_URL}`,
      {
        access_token: effectiveToken,
        publisher_ids: JSON.stringify(pageIds),
        ad_reached_countries: JSON.stringify(countries),
        ad_active_status: options.adActiveStatus || 'ACTIVE',
        ad_type: options.adType || 'ALL',
        fields: META_ADS_FIELDS,
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
