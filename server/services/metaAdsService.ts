import axios from 'axios';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

/**
 * Meta Ads Service — Optimized for Full Data Capture
 */

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0/ads_archive';

// Token temporário de teste (será substituído pelo token do usuário se disponível)
const FALLBACK_ACCESS_TOKEN = "EAAMuA4Ly8N0BRIi2Saek93TUvuhqBM7g0MST6eVojAk0picNTzwlP8zWTcqw6TlNbgQ3lYPuw0ymJOfQ1Ax2q8otACXKktvcGsJZCVy9F5kDZB4WzqIWjyyNqNZBoYpDMKkl6ZAoV4gqAZBlfh42yzvFsMSuWrvQ9zCnUUwmuqlRK2yY7J72FMoVXn9WkaRnpLaCdJUZCZBMMfpY8yb5y3RVF4nZAaYrH4BRLs2vlhRaeuejPYZBzknljhzCee1Pol6JZB0AQ53ljMpZCvPsnA2S29IkSG7ggcuZAqx110oZD";

// Todos os campos suportados para máxima inteligência competitiva
export const META_ADS_FIELDS = [
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

interface MetaSearchParams {
  accessToken: string;
  searchTerms?: string;
  searchPageIds?: string[];
  adReachedCountries?: string[];
  adActiveStatus?: string;
  adType?: string;
  adDeliveryDateMin?: string;
  adDeliveryDateMax?: string;
  mediaType?: string;
  publisherPlatforms?: string[];
  limit?: number;
  after?: string;
  fields?: string;
}

/**
 * Classifica e trata erros da Meta API
 */
function handleMetaError(error: any, context: string) {
  const data = error.response?.data?.error || {};
  const message = data.message || error.message;
  const code = data.code;
  const subcode = data.error_subcode;

  logger.error(`[MetaAPI] ${context}`, { message, code, subcode });
  
  if (code === 190) throw new Error("Token da Meta expirado ou inválido.");
  if (code === 17) throw new Error("Limite de requisições da Meta atingido (Rate Limit).");
  
  throw new Error(`Erro na API da Meta: ${message}`);
}

/**
 * Função central de busca na Ads Library
 */
export async function fetchAdsArchive(params: MetaSearchParams) {
  const {
    accessToken,
    searchTerms,
    searchPageIds,
    adReachedCountries = ['BR'],
    adActiveStatus = 'ACTIVE',
    adType = 'ALL',
    limit = 25,
    after,
    fields = META_ADS_FIELDS
  } = params;

  const effectiveToken = (!accessToken || accessToken.length < 20) ? FALLBACK_ACCESS_TOKEN : accessToken;

  // Cache key baseada nos parâmetros principais
  const cacheKey = `meta:search:${searchTerms || 'all'}:${adReachedCountries.join(',')}:${after || 'first'}`;
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

  try {
    const queryParams: any = {
      access_token: effectiveToken,
      ad_reached_countries: JSON.stringify(adReachedCountries),
      ad_active_status: adActiveStatus,
      ad_type: adType,
      fields,
      limit,
    };

    if (searchTerms && searchTerms !== ".") queryParams.search_terms = searchTerms;
    if (searchPageIds && searchPageIds.length > 0) queryParams.search_page_ids = JSON.stringify(searchPageIds);
    if (after) queryParams.after = after;
    if (params.adDeliveryDateMin) queryParams.ad_delivery_date_min = params.adDeliveryDateMin;
    if (params.mediaType) queryParams.media_type = params.mediaType;

    const response = await axios.get(META_GRAPH_URL, { params: queryParams });
    
    appCache.set(cacheKey, response.data, 15 * 60 * 1000); // 15 min cache
    return response.data;
  } catch (error) {
    return handleMetaError(error, `Busca por ${searchTerms || 'páginas'}`);
  }
}

/**
 * Wrapper de compatibilidade legada (mantido para evitar quebras em outros módulos)
 */
export async function searchAdsArchive(params: any) {
  return fetchAdsArchive({
    accessToken: params.accessToken,
    searchTerms: params.searchTerms,
    searchPageIds: params.searchPageIds,
    adReachedCountries: params.adReachedCountries,
    adType: params.adType,
    adActiveStatus: params.adActiveStatus,
    limit: params.limit,
    after: params.after,
    adDeliveryDateMin: params.adDeliveryDateMin,
    mediaType: params.mediaType
  });
}
