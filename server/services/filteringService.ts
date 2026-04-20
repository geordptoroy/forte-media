import { logger } from '../_core/logger';
import crypto from 'crypto';

/**
 * Serviço de Filtragem e Agrupamento de Anúncios
 * Responsável por toda a lógica de filtros e agrupamento de criativos
 * com logs detalhados e performance otimizada
 */

// --- TIPOS E INTERFACES ---

export interface FilterParams {
  scaleMin?: number;
  scaleMax?: number;
  durationMin?: number;
  durationMax?: number;
  productTypes?: string[];
  funnelTypes?: string[];
  excludePolitical?: boolean;
  country?: string;
  currency?: string;
  minSpend?: number;
}

export interface AdWithMetadata {
  id: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_media_urls?: string[];
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  page_name?: string;
  page_id?: string;
  publisher_platforms?: string[];
  impressions?: { lower_bound?: number; upper_bound?: number };
  spend?: { lower_bound?: number; upper_bound?: number };
  bylines?: string;
  currency?: string;
  target_locations?: any[];
  detectedTypes?: string[];
  detectedFunnels?: string[];
  isNegative?: boolean;
}

export interface ProcessedAd extends AdWithMetadata {
  creativeHash: string;
  frequency: number;
  daysActive: number;
  destination_url?: string;
  collationCount: number;
  isFirstInGroup: boolean;
  filterScore?: number;
}

// --- CONSTANTES ---

const CREATIVE_HASH_FIELDS = ['body', 'title', 'description', 'url', 'media', 'cta'];

// --- FUNÇÕES UTILITÁRIAS ---

/**
 * Normaliza texto para comparação
 */
function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-]/g, '');
}

/**
 * Normaliza URL removendo query parameters
 */
function normalizeUrl(url?: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    return url.split('?')[0].toLowerCase().trim();
  }
}

/**
 * Gera hash único para criativo do anúncio
 * Usado para agrupar duplicatas
 */
export function generateCreativeHash(ad: AdWithMetadata): string {
  const body = normalizeText(ad.ad_creative_bodies?.[0]);
  const title = normalizeText(ad.ad_creative_link_titles?.[0]);
  const desc = normalizeText(ad.ad_creative_link_descriptions?.[0]);
  const url = normalizeUrl(ad.ad_creative_link_urls?.[0] || ad.ad_creative_link_captions?.[0]);
  const media = normalizeText(ad.ad_creative_media_urls?.[0] || ad.ad_snapshot_url);
  const cta = normalizeText(ad.ad_creative_call_to_action_type);

  const hashInput = `${body}|${title}|${desc}|${url}|${media}|${cta}`;
  return crypto.createHash('md5').update(hashInput).digest('hex');
}

/**
 * Calcula dias ativos desde o início da veiculação
 */
export function calculateDaysActive(startDate?: string): number {
  if (!startDate) return 0;
  try {
    const start = new Date(startDate);
    const now = new Date();
    if (isNaN(start.getTime())) return 0;
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    logger.warn(`[Filtering] Invalid date format: ${startDate}`);
    return 0;
  }
}

// --- AGRUPAMENTO DE CRIATIVOS ---

/**
 * Agrupa anúncios por criativo e calcula frequência
 * Retorna mapa com hash -> lista de anúncios
 */
export function groupAdsByCreative(ads: AdWithMetadata[]): Map<string, AdWithMetadata[]> {
  const groups = new Map<string, AdWithMetadata[]>();

  for (const ad of ads) {
    const hash = generateCreativeHash(ad);
    if (!groups.has(hash)) {
      groups.set(hash, []);
    }
    groups.get(hash)!.push(ad);
  }

  logger.info(`[Filtering] Agrupamento: ${ads.length} anúncios em ${groups.size} grupos únicos`);
  return groups;
}

/**
 * Enriquece anúncios com metadados de agrupamento
 */
export function enrichAdsWithGroupMetadata(
  ads: AdWithMetadata[],
  creativeGroups: Map<string, AdWithMetadata[]>
): ProcessedAd[] {
  return ads.map((ad) => {
    const hash = generateCreativeHash(ad);
    const group = creativeGroups.get(hash) || [ad];
    const frequency = group.length;
    const daysActive = calculateDaysActive(ad.ad_delivery_start_time);

    return {
      ...ad,
      creativeHash: hash,
      frequency,
      collationCount: frequency, // Sincronizar frequency com collationCount
      daysActive,
      isFirstInGroup: group[0]?.id === ad.id,
    } as ProcessedAd;
  });
}

// --- FILTROS INDIVIDUAIS ---

/**
 * Filtro de escala (frequência de criativos)
 */
export function filterByScale(ad: ProcessedAd, scaleMin: number, scaleMax: number): boolean {
  if (ad.frequency < scaleMin || ad.frequency > scaleMax) {
    return false;
  }
  return true;
}

/**
 * Filtro de duração de veiculação
 */
export function filterByDuration(ad: ProcessedAd, durationMin: number, durationMax: number): boolean {
  if (ad.daysActive < durationMin || ad.daysActive > durationMax) {
    return false;
  }
  return true;
}

/**
 * Filtro de tipos de produto
 */
export function filterByProductType(ad: ProcessedAd, productTypes?: string[]): boolean {
  if (!productTypes || productTypes.length === 0 || productTypes.includes('all')) {
    return true;
  }

  const adTypes = ad.detectedTypes || ['Outros'];
  const hasMatch = adTypes.some((type) => productTypes.includes(type));

  if (!hasMatch) {
    logger.debug(
      `[Filtering] Ad ${ad.id} filtrado por tipo: anúncio tem ${adTypes.join(', ')}, filtro busca ${productTypes.join(', ')}`
    );
  }

  return hasMatch;
}

/**
 * Filtro de tipos de funil
 */
export function filterByFunnelType(ad: ProcessedAd, funnelTypes?: string[]): boolean {
  if (!funnelTypes || funnelTypes.length === 0 || funnelTypes.includes('all')) {
    return true;
  }

  const adFunnels = ad.detectedFunnels || ['Indefinido'];
  const hasMatch = adFunnels.some((funnel) => funnelTypes.includes(funnel));

  if (!hasMatch) {
    logger.debug(
      `[Filtering] Ad ${ad.id} filtrado por funil: anúncio tem ${adFunnels.join(', ')}, filtro busca ${funnelTypes.join(', ')}`
    );
  }

  return hasMatch;
}

/**
 * Filtro de anúncios políticos
 */
export function filterByPolitical(ad: ProcessedAd, excludePolitical: boolean): boolean {
  if (excludePolitical && ad.bylines) {
    logger.debug(`[Filtering] Ad ${ad.id} filtrado: é anúncio político`);
    return false;
  }
  return true;
}

/**
 * Filtro de anúncios negativos (spam, novelas, etc)
 */
export function filterByNegative(ad: ProcessedAd): boolean {
  if (ad.isNegative) {
    logger.debug(`[Filtering] Ad ${ad.id} filtrado: é anúncio negativo (spam/novela)`);
    return false;
  }
  return true;
}

/**
 * Filtro de moeda
 */
export function filterByCurrency(ad: ProcessedAd, currency?: string): boolean {
  if (!currency) return true;
  if (ad.currency !== currency) {
    return false;
  }
  return true;
}

/**
 * Filtro de gasto mínimo
 */
export function filterByMinSpend(ad: ProcessedAd, minSpend: number): boolean {
  if (minSpend <= 0) return true;
  const adSpend = ad.spend?.lower_bound || 0;
  if (adSpend < minSpend) {
    return false;
  }
  return true;
}

/**
 * Filtro de país (baseado em target_locations)
 */
export function filterByCountry(ad: ProcessedAd, country?: string): boolean {
  if (!country || country === 'ALL') return true;

  // Se o anúncio tiver target_locations, verificar se inclui o país
  if (ad.target_locations && Array.isArray(ad.target_locations)) {
    const hasCountry = ad.target_locations.some(
      (loc: any) => loc.country === country || loc.country_code === country
    );
    if (!hasCountry) {
      logger.debug(`[Filtering] Ad ${ad.id} filtrado por país: não atinge ${country}`);
      return false;
    }
  }

  return true;
}

// --- APLICAÇÃO DE FILTROS ---

/**
 * Aplica todos os filtros a um anúncio
 * Retorna true se o anúncio passa em todos os filtros
 */
export function applyAllFilters(ad: ProcessedAd, params: FilterParams): boolean {
  const {
    scaleMin = 1,
    scaleMax = 1000,
    durationMin = 1,
    durationMax = 365,
    productTypes,
    funnelTypes,
    excludePolitical = true,
    country,
    currency,
    minSpend = 0,
  } = params;

  // Aplicar filtros em ordem de performance (mais rápidos primeiro)
  if (!filterByNegative(ad)) return false;
  if (!filterByPolitical(ad, excludePolitical)) return false;
  if (!filterByScale(ad, scaleMin, scaleMax)) return false;
  if (!filterByDuration(ad, durationMin, durationMax)) return false;
  if (!filterByProductType(ad, productTypes)) return false;
  if (!filterByFunnelType(ad, funnelTypes)) return false;
  if (!filterByCurrency(ad, currency)) return false;
  if (!filterByMinSpend(ad, minSpend)) return false;
  if (!filterByCountry(ad, country)) return false;

  return true;
}

/**
 * Filtra lista de anúncios processados
 */
export function filterAds(ads: ProcessedAd[], params: FilterParams): ProcessedAd[] {
  const startTime = Date.now();
  const filtered = ads.filter((ad) => applyAllFilters(ad, params));
  const duration = Date.now() - startTime;

  logger.info(
    `[Filtering] Filtrados ${ads.length} anúncios -> ${filtered.length} resultados em ${duration}ms`
  );
  logger.info(`[Filtering] Parâmetros: ${JSON.stringify(params)}`);

  return filtered;
}

// --- ORDENAÇÃO ---

/**
 * Ordena anúncios por escala (frequência) descendente
 */
export function sortByScale(ads: ProcessedAd[]): ProcessedAd[] {
  return ads.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
}

/**
 * Ordena anúncios por dias ativos descendente
 */
export function sortByDaysActive(ads: ProcessedAd[]): ProcessedAd[] {
  return ads.sort((a, b) => (b.daysActive || 0) - (a.daysActive || 0));
}

/**
 * Ordena anúncios por impressões descendente
 */
export function sortByImpressions(ads: ProcessedAd[]): ProcessedAd[] {
  return ads.sort(
    (a, b) => (b.impressions?.upper_bound || 0) - (a.impressions?.upper_bound || 0)
  );
}

// --- PIPELINE COMPLETO ---

/**
 * Pipeline completo de processamento:
 * 1. Agrupar por criativo
 * 2. Enriquecer com metadados
 * 3. Aplicar filtros
 * 4. Ordenar por escala
 */
export function processAndFilterAds(
  rawAds: AdWithMetadata[],
  params: FilterParams
): ProcessedAd[] {
  const startTime = Date.now();

  logger.info(`[Filtering] Iniciando pipeline com ${rawAds.length} anúncios brutos`);

  // 1. Agrupar
  const creativeGroups = groupAdsByCreative(rawAds);

  // 2. Enriquecer
  const enriched = enrichAdsWithGroupMetadata(rawAds, creativeGroups);
  logger.info(`[Filtering] Enriquecidos com metadados de agrupamento`);

  // 3. Filtrar
  const filtered = filterAds(enriched, params);

  // 4. Ordenar
  const sorted = sortByScale(filtered);

  const totalDuration = Date.now() - startTime;
  logger.info(`[Filtering] Pipeline completo: ${totalDuration}ms`);

  return sorted;
}

// --- VALIDAÇÃO ---

/**
 * Valida parâmetros de filtro
 */
export function validateFilterParams(params: FilterParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.scaleMin && params.scaleMax && params.scaleMin > params.scaleMax) {
    errors.push('scaleMin não pode ser maior que scaleMax');
  }

  if (params.durationMin && params.durationMax && params.durationMin > params.durationMax) {
    errors.push('durationMin não pode ser maior que durationMax');
  }

  if (params.scaleMin && params.scaleMin < 1) {
    errors.push('scaleMin deve ser >= 1');
  }

  if (params.durationMin && params.durationMin < 1) {
    errors.push('durationMin deve ser >= 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
