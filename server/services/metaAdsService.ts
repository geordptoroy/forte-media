import axios, { AxiosError } from 'axios';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

/**
 * Meta Ads Service — v2 (Otimizado)
 * 
 * Melhorias:
 * 1. Retry automático com exponential backoff
 * 2. Tratamento específico de erros da Meta API
 * 3. Rate limiting inteligente
 * 4. Cache com TTL configurável
 * 5. Logging detalhado para debugging
 */

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

interface MetaApiError {
  code: number;
  message: string;
  type: string;
  fbtrace_id?: string;
}

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

/**
 * Classificação de erros da Meta API
 */
function classifyMetaError(error: any): {
  type: 'rate_limit' | 'auth' | 'invalid_input' | 'server_error' | 'unknown';
  retryable: boolean;
  message: string;
} {
  const errorCode = error?.error?.code || error?.code;
  const errorMessage = error?.error?.message || error?.message || '';

  // Rate Limiting (429, 80004, 80006, 80007)
  if (errorCode === 429 || [80004, 80006, 80007].includes(errorCode)) {
    return {
      type: 'rate_limit',
      retryable: true,
      message: `Rate limit atingido. Retry em ${error?.error?.error_data?.wait_time || 'alguns'} segundos`,
    };
  }

  // Autenticação (401, 190, 102)
  if (errorCode === 401 || [190, 102].includes(errorCode)) {
    return {
      type: 'auth',
      retryable: false,
      message: 'Token inválido ou expirado',
    };
  }

  // Entrada Inválida (400, 2500, 2501)
  if (errorCode === 400 || [2500, 2501].includes(errorCode)) {
    return {
      type: 'invalid_input',
      retryable: false,
      message: `Entrada inválida: ${errorMessage}`,
    };
  }

  // Erro do Servidor (500, 1, 2)
  if (errorCode === 500 || [1, 2].includes(errorCode)) {
    return {
      type: 'server_error',
      retryable: true,
      message: 'Erro no servidor da Meta. Tentando novamente...',
    };
  }

  return {
    type: 'unknown',
    retryable: true,
    message: `Erro desconhecido: ${errorMessage}`,
  };
}

/**
 * Aguarda com backoff exponencial
 */
async function exponentialBackoff(
  attempt: number,
  config: RetryConfig
): Promise<void> {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Executa requisição com retry automático
 */
async function requestWithRetry<T>(
  url: string,
  params: Record<string, any>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      logger.debug('[MetaAPI] Requisição', {
        url,
        attempt: attempt + 1,
        maxAttempts: config.maxRetries + 1,
      });

      const response = await axios.get(url, {
        params,
        timeout: 15000,
        headers: {
          'User-Agent': 'ForteMedia/3.0',
        },
      });

      return response.data;
    } catch (error: any) {
      lastError = error;
      const classification = classifyMetaError(error.response?.data);

      logger.warn('[MetaAPI] Erro na requisição', {
        attempt: attempt + 1,
        errorType: classification.type,
        errorCode: error.response?.status,
        message: classification.message,
        fbtrace_id: error.response?.data?.error?.fbtrace_id,
      });

      // Se não é retentável, lançar imediatamente
      if (!classification.retryable) {
        throw new Error(classification.message);
      }

      // Se é a última tentativa, lançar
      if (attempt === config.maxRetries) {
        throw new Error(`Falha após ${config.maxRetries + 1} tentativas: ${classification.message}`);
      }

      // Aguardar antes de retry
      await exponentialBackoff(attempt, config);
    }
  }

  throw lastError;
}

/**
 * Buscar anúncios por keywords
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
  // Verificar cache
  const cacheKey = `meta:search:${keywords}:${countries.join(',')}`;
  const cached = appCache.get(cacheKey);
  if (cached) {
    logger.debug('[MetaAPI] Cache hit', { cacheKey });
    return cached;
  }

  try {
    const result = await requestWithRetry(
      `${META_GRAPH_URL}/ads_archive`,
      {
        access_token: accessToken,
        search_terms: keywords,
        ad_reached_countries: JSON.stringify(countries),
        ad_active_status: options.adActiveStatus || 'ACTIVE',
        ad_type: options.adType || 'ALL',
        fields: 'id,ad_creative_bodies,ad_snapshot_url,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,ad_creative_link_titles,ad_creative_link_descriptions,currency,spend,impressions',
        limit: Math.min(options.limit || 100, 1000),
        after: options.after,
      }
    );

    // Cache por 1 hora
    appCache.set(cacheKey, result, 60 * 60 * 1000);

    logger.info('[MetaAPI] Busca bem-sucedida', {
      keywords,
      resultCount: result.data?.length || 0,
    });

    return result;
  } catch (error: any) {
    logger.error('[MetaAPI] Erro na busca por keywords', {
      keywords,
      error: error.message,
    });
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
  // Verificar cache
  const cacheKey = `meta:pages:${pageIds.join(',')}:${countries.join(',')}`;
  const cached = appCache.get(cacheKey);
  if (cached) {
    logger.debug('[MetaAPI] Cache hit', { cacheKey });
    return cached;
  }

  try {
    const result = await requestWithRetry(
      `${META_GRAPH_URL}/ads_archive`,
      {
        access_token: accessToken,
        publisher_ids: JSON.stringify(pageIds),
        ad_reached_countries: JSON.stringify(countries),
        ad_active_status: options.adActiveStatus || 'ACTIVE',
        ad_type: options.adType || 'ALL',
        fields: 'id,ad_creative_bodies,ad_snapshot_url,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,ad_creative_link_titles,ad_creative_link_descriptions,currency,spend,impressions',
        limit: Math.min(options.limit || 100, 1000),
        after: options.after,
      }
    );

    // Cache por 1 hora
    appCache.set(cacheKey, result, 60 * 60 * 1000);

    logger.info('[MetaAPI] Busca por páginas bem-sucedida', {
      pageCount: pageIds.length,
      resultCount: result.data?.length || 0,
    });

    return result;
  } catch (error: any) {
    logger.error('[MetaAPI] Erro na busca por páginas', {
      pageIds,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Obter informações detalhadas de um anúncio
 */
export async function getAdDetails(
  accessToken: string,
  adId: string
): Promise<any> {
  const cacheKey = `meta:ad:${adId}`;
  const cached = appCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const result = await requestWithRetry(
      `${META_GRAPH_URL}/${adId}`,
      {
        access_token: accessToken,
        fields: 'id,ad_creative_bodies,ad_snapshot_url,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,ad_creative_link_titles,ad_creative_link_descriptions,currency,spend,impressions',
      }
    );

    // Cache por 24 horas
    appCache.set(cacheKey, result, 24 * 60 * 60 * 1000);

    return result;
  } catch (error: any) {
    logger.error('[MetaAPI] Erro ao obter detalhes do anúncio', {
      adId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Limpar cache de Meta API
 */
export function clearMetaCache(): void {
  appCache.invalidatePattern('^meta:');
  logger.info('[MetaAPI] Cache limpo');
}
