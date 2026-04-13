import axios from 'axios';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

/**
 * Meta Ads Service — Refatorado para Extração Máxima de Dados
 */

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0/ads_archive';

// Token temporário fornecido pelo usuário para testes e fallback (Duração: 2 horas)
const FALLBACK_ACCESS_TOKEN = "EAAMuA4Ly8N0BRKcQNbnGxK8MMTvQpzAkAbYyzLKWoGWyvF7HCUQ9HgGS1hnawHCQr2wLB2efIRyLju0QfLTP4HjD10UVfoScDKVxZAo90XOzQIR5rE8BRFyR0sHQUVifeZBRwaroatZBiEgpDBZAprgtemgEjjfcrXqchdnyhR3TGOuqKNyDtKeZCOivUbkakej6nk80CryWXKR7xVXIvM0fBFfxAGRNlyYZAOiJzUSsvDS0lZCTWHMZANV11b9RKu76ZAuKY0zS4pV2FKDHO8lzSvbk9OqNeU7YuxQZDZD";

// Lista exaustiva de campos para capturar o máximo de inteligência competitiva
export const META_ADS_FIELDS = [
  'id',
  'ad_creation_time',
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
  'estimated_audience_size',
  'eu_total_reach',
  'br_total_reach'
].join(',');

export interface MetaSearchParams {
  accessToken: string;
  searchTerms?: string;
  searchPageIds?: string[];
  adReachedCountries?: string[];
  adActiveStatus?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS' | 'HOUSING_ADS' | 'EMPLOYMENT_ADS' | 'CREDIT_ADS' | 'FINANCIAL_PRODUCTS_AND_SERVICES_ADS';
  adDeliveryDateMin?: string;
  adDeliveryDateMax?: string;
  mediaType?: 'ALL' | 'IMAGE' | 'VIDEO' | 'MEME' | 'NONE';
  publisherPlatforms?: string[];
  searchType?: 'KEYWORD_UNORDERED' | 'KEYWORD_EXACT_PHRASE';
  limit?: number;
  after?: string;
  fields?: string;
}

/**
 * Classifica e trata erros da Meta API com logs detalhados
 */
function handleMetaError(error: any, context: string) {
  const data = error.response?.data?.error || {};
  const message = data.message || error.message;
  const code = data.code;
  const subcode = data.error_subcode;

  logger.error(`[MetaAPI] Erro em ${context}`, { 
    message, 
    code, 
    subcode,
    stack: error.stack 
  });
  
  if (code === 190) throw new Error("Token da Meta expirado ou inválido. Por favor, reconecte sua conta.");
  if (code === 17 || code === 4 || code === 341) throw new Error("Limite de requisições da Meta atingido (Rate Limit). Tente novamente em alguns minutos.");
  if (code === 10) throw new Error("Permissão insuficiente para acessar a Ad Library API.");
  
  throw new Error(`Erro na API da Meta: ${message}`);
}

/**
 * Função central de busca na Ads Library com suporte a cache e paginação
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
    fields = META_ADS_FIELDS,
    searchType = 'KEYWORD_UNORDERED'
  } = params;

  const effectiveToken = (!accessToken || accessToken.length < 20) ? FALLBACK_ACCESS_TOKEN : accessToken;

  // Gerar chave de cache baseada nos parâmetros de busca
  const cacheKey = `meta:v2:search:${JSON.stringify({
    searchTerms,
    searchPageIds,
    adReachedCountries,
    adActiveStatus,
    adType,
    limit,
    after,
    searchType
  })}`;

  const cached = appCache.get(cacheKey);
  if (cached) {
    logger.info(`[MetaAPI] Retornando resultados do cache para: ${searchTerms || 'IDs de Página'}`);
    return cached;
  }

  try {
    const queryParams: any = {
      access_token: effectiveToken,
      ad_reached_countries: JSON.stringify(adReachedCountries),
      ad_active_status: adActiveStatus,
      ad_type: adType,
      fields,
      limit,
      search_type: searchType
    };

    if (searchTerms && searchTerms.trim() !== "") {
      queryParams.search_terms = searchTerms;
    }
    
    if (searchPageIds && searchPageIds.length > 0) {
      queryParams.search_page_ids = JSON.stringify(searchPageIds);
    }
    
    if (after) queryParams.after = after;
    if (params.adDeliveryDateMin) queryParams.ad_delivery_date_min = params.adDeliveryDateMin;
    if (params.adDeliveryDateMax) queryParams.ad_delivery_date_max = params.adDeliveryDateMax;
    if (params.mediaType && params.mediaType !== 'ALL') queryParams.media_type = params.mediaType;
    if (params.publisherPlatforms && params.publisherPlatforms.length > 0) {
      queryParams.publisher_platforms = JSON.stringify(params.publisherPlatforms);
    }

    logger.info(`[MetaAPI] Iniciando busca: ${searchTerms || 'IDs de Página'} em ${adReachedCountries.join(', ')}`);
    
    const startTime = Date.now();
    const response = await axios.get(META_GRAPH_URL, { params: queryParams });
    const duration = Date.now() - startTime;

    logger.info(`[MetaAPI] Busca concluída em ${duration}ms. Resultados: ${response.data?.data?.length || 0}`);

    // Emitir evento para o SSE Tracker
    logger.emitEvent(`meta_event:${params.accessToken ? 'user' : 'system'}`, {
      type: 'response',
      service: 'ad_library',
      action: 'search',
      timestamp: new Date().toISOString(),
      duration,
      payload: {
        count: response.data?.data?.length || 0,
        terms: searchTerms,
        countries: adReachedCountries
      }
    });

    appCache.set(cacheKey, response.data, 10 * 60 * 1000); // 10 min cache
    return response.data;
  } catch (error) {
    return handleMetaError(error, `Busca por ${searchTerms || 'páginas'}`);
  }
}

/**
 * Wrapper para busca por palavras-chave
 */
export async function searchAdsByKeywords(
  userId: number,
  accessToken: string,
  keywords: string,
  countries: string[],
  options: Partial<MetaSearchParams> = {}
) {
  return fetchAdsArchive({
    accessToken,
    searchTerms: keywords,
    adReachedCountries: countries,
    ...options
  });
}

/**
 * Wrapper para busca por páginas
 */
export async function searchAdsByPages(
  userId: number,
  accessToken: string,
  pageIds: string[],
  countries: string[],
  options: Partial<MetaSearchParams> = {}
) {
  return fetchAdsArchive({
    accessToken,
    searchPageIds: pageIds,
    adReachedCountries: countries,
    ...options
  });
}

/**
 * Wrapper de compatibilidade legada
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
    adDeliveryDateMax: params.adDeliveryDateMax,
    mediaType: params.mediaType,
    publisherPlatforms: params.publisherPlatforms,
    searchType: params.searchType
  });
}
