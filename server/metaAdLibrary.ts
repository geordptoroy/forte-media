/**
 * Integração com Meta Ad Library API
 * Busca anúncios competitivos com análise avançada de escalabilidade
 *
 * IMPORTANTE: A Meta Ad Library API (ads_archive) retorna campos em snake_case.
 * Os campos spend, impressions e media_type NÃO são retornados para anúncios
 * comuns (ad_type=ALL). Apenas anúncios políticos (POLITICAL_AND_ISSUE_ADS)
 * possuem esses campos em países específicos.
 */

import { searchAdsArchive } from "./services/metaAdsService";

export interface AdLibrarySearchParams {
  searchTerms: string[];
  countries: string[];
  adType?: "POLITICAL" | "ISSUE_ADS" | "ALL";
  limit?: number;
  after?: string;
}

export interface ScalingAnalysisParams {
  minSpend?: number;
  minCTR?: number;
  minROAS?: number;
  minImpressions?: number;
  minDaysActive?: number;
}

/**
 * Estrutura do anúncio retornado — campos em snake_case para compatibilidade
 * com AdCard.tsx e demais componentes do frontend.
 */
export interface AdLibraryAd {
  id: string;
  page_id: string;
  page_name: string;
  ad_snapshot_url: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  currency?: string;
  spend?: { range?: string; min?: number; max?: number } | string | null;
  impressions?: { range?: string; min?: number; max?: number } | string | null;
  media_type?: string;
  // Computed fields for scaling analysis
  scalingScore?: number;
  scalingReasons?: string[];
  daysActive?: number;
  estimatedCPM?: number;
  estimatedCTR?: number;
}

export interface AdLibrarySearchResult {
  ads: AdLibraryAd[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

/**
 * Buscar anúncios na Ad Library usando o serviço centralizado metaAdsService
 */
export async function searchAdLibrary(
  accessToken: string,
  params: AdLibrarySearchParams
): Promise<AdLibrarySearchResult> {
  try {
    // Normalizar search_terms: espaço = AND, vírgula = OR
    // A Meta Ad Library exige um termo não vazio; usamos "." como curinga genérico
    const rawTerms = params.searchTerms.join(" ").trim();
    const searchTermsFormatted = rawTerms === "" || rawTerms === "*" ? "." : rawTerms;

    const result = await searchAdsArchive({
      accessToken,
      adReachedCountries: params.countries,
      searchTerms: searchTermsFormatted,
      adType: params.adType === "ALL" ? "ALL" : undefined,
      limit: params.limit || 25,
      after: params.after,
      fields: [
        "id",
        "page_id",
        "page_name",
        "ad_snapshot_url",
        "ad_delivery_start_time",
        "ad_delivery_stop_time",
        "publisher_platforms",
        "ad_creative_bodies",
        "ad_creative_link_titles",
        "ad_creative_link_descriptions",
        "currency",
        "spend",
        "impressions",
        "media_type",
      ],
    });

    return {
      ads: (result.data || []).map((ad) => ({
        id: ad.id,
        page_id: ad.page_id,
        page_name: ad.page_name,
        ad_snapshot_url: ad.ad_snapshot_url,
        ad_delivery_start_time: ad.ad_delivery_start_time,
        ad_delivery_stop_time: ad.ad_delivery_stop_time,
        publisher_platforms: ad.publisher_platforms,
        ad_creative_bodies: ad.ad_creative_bodies,
        ad_creative_link_titles: ad.ad_creative_link_titles,
        ad_creative_link_descriptions: ad.ad_creative_link_descriptions,
        currency: ad.currency,
        spend: ad.spend ?? null,
        impressions: ad.impressions ?? null,
        media_type: (ad as unknown as Record<string, unknown>).media_type as string | undefined,
      })),
      paging: result.paging
        ? {
            cursors: {
              before: result.paging.cursors?.before || "",
              after: result.paging.cursors?.after || "",
            },
          }
        : { cursors: { before: "", after: "" } },
    };
  } catch (error) {
    console.error("[Ad Library] Search error:", error);
    throw error;
  }
}

/**
 * Calcular dias ativos de um anúncio
 */
function calculateDaysActive(startTime?: string, stopTime?: string): number {
  if (!startTime) return 0;
  try {
    const start = new Date(startTime).getTime();
    const end = stopTime ? new Date(stopTime).getTime() : Date.now();
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

/**
 * Extrair valor numérico de spend/impressions (que pode ser objeto range ou string)
 */
function extractNumericValue(value: AdLibraryAd["spend"] | AdLibraryAd["impressions"]): number {
  if (!value) return 0;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object") {
    // Objeto com min/max — usar média
    const min = value.min ?? 0;
    const max = value.max ?? 0;
    if (min > 0 || max > 0) return (min + max) / 2;
    // Tentar extrair do campo range (ex: "1000-5000")
    if (value.range) {
      const parts = value.range.split("-").map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return (parts[0] + parts[1]) / 2;
      }
      return parseFloat(value.range) || 0;
    }
  }
  return 0;
}

/**
 * Calcular CPM (Cost Per Mille) estimado
 */
function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (spend / impressions) * 1000;
}

/**
 * Calcular CTR (Click-Through Rate) estimado baseado em impressões
 * Nota: Ad Library não fornece clicks, então usamos uma heurística
 */
function estimateCTR(impressions: number, spend: number): number {
  // Heurística: anúncios com mais impressões por dólar tendem a ter melhor CTR
  if (impressions === 0 || spend === 0) return 0;
  const impressionsPerDollar = impressions / spend;
  // Normalizar para CTR estimado (0.5% a 5%)
  return Math.min(5, Math.max(0.5, (impressionsPerDollar / 100) * 2));
}

/**
 * Analisar escalabilidade de um anúncio
 * Quando spend/impressions não estão disponíveis, usa critérios alternativos
 */
function analyzeScaling(ad: AdLibraryAd): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const spend = extractNumericValue(ad.spend);
  const impressions = extractNumericValue(ad.impressions);
  const daysActive = calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
  const cpm = calculateCPM(spend, impressions);
  const estimatedCTR = estimateCTR(impressions, spend);

  // Critério 1: Gasto mínimo (indica confiança do anunciante)
  if (spend >= 100) {
    score += 20;
    reasons.push(`Gasto significativo: $${spend.toFixed(2)}`);
  }

  // Critério 2: Impressões altas (indica alcance)
  if (impressions >= 10000) {
    score += 20;
    reasons.push(`Alcance elevado: ${impressions.toLocaleString()} impressões`);
  }

  // Critério 3: CPM baixo (indica eficiência)
  if (cpm > 0 && cpm <= 1) {
    score += 20;
    reasons.push(`CPM muito eficiente: $${cpm.toFixed(2)}`);
  } else if (cpm > 1 && cpm <= 2) {
    score += 15;
    reasons.push(`CPM eficiente: $${cpm.toFixed(2)}`);
  }

  // Critério 4: CTR estimado alto
  if (estimatedCTR >= 2) {
    score += 20;
    reasons.push(`CTR estimado alto: ${estimatedCTR.toFixed(2)}%`);
  } else if (estimatedCTR >= 1) {
    score += 10;
    reasons.push(`CTR estimado bom: ${estimatedCTR.toFixed(2)}%`);
  }

  // Critério 5: Duração de atividade (indica consistência)
  if (daysActive >= 30) {
    score += 20;
    reasons.push(`Ativo por ${daysActive} dias (consistência alta)`);
  } else if (daysActive >= 14) {
    score += 15;
    reasons.push(`Ativo por ${daysActive} dias (consistência boa)`);
  } else if (daysActive >= 7) {
    score += 10;
    reasons.push(`Ativo por ${daysActive} dias`);
  } else if (daysActive >= 1) {
    score += 5;
    reasons.push(`Ativo por ${daysActive} dia${daysActive > 1 ? "s" : ""}`);
  }

  // Critério 6: Tipo de mídia (vídeos tendem a escalar melhor)
  if (ad.media_type === "VIDEO") {
    score += 10;
    reasons.push("Formato de vídeo (melhor engajamento)");
  }

  // Critério 7: Múltiplas plataformas (indica campanha escalada)
  if (ad.publisher_platforms && ad.publisher_platforms.length >= 3) {
    score += 10;
    reasons.push(`Veiculado em ${ad.publisher_platforms.length} plataformas`);
  } else if (ad.publisher_platforms && ad.publisher_platforms.length >= 2) {
    score += 5;
    reasons.push(`Veiculado em ${ad.publisher_platforms.length} plataformas`);
  }

  // Critério 8: Tem copy criativo (indica anúncio bem estruturado)
  if (ad.ad_creative_bodies && ad.ad_creative_bodies.length > 0) {
    score += 5;
    reasons.push("Criativo com copy definido");
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Buscar anúncios escalados (alto desempenho)
 * Retorna anúncios ordenados por score de escalabilidade
 */
export async function searchScaledAds(
  accessToken: string,
  countries: string[],
  params?: ScalingAnalysisParams
): Promise<AdLibraryAd[]> {
  try {
    const result = await searchAdLibrary(accessToken, {
      searchTerms: ["."],
      countries,
      adType: "ALL",
      limit: 100,
    });

    // Enriquecer anúncios com análise de escalabilidade
    const enrichedAds = result.ads.map((ad) => {
      const daysActive = calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
      const spendNum = extractNumericValue(ad.spend);
      const impressionsNum = extractNumericValue(ad.impressions);
      const cpm = calculateCPM(spendNum, impressionsNum);
      const estimatedCTR = estimateCTR(impressionsNum, spendNum);
      const { score, reasons } = analyzeScaling(ad);

      return {
        ...ad,
        daysActive,
        estimatedCPM: cpm,
        estimatedCTR,
        scalingScore: score,
        scalingReasons: reasons,
      };
    });

    // Filtrar por critérios de escalabilidade
    // NOTA: spend/impressions frequentemente não estão disponíveis na Ad Library API
    // para anúncios comuns, então os filtros de spend/impressions são aplicados apenas
    // quando os dados estão disponíveis.
    let filtered = enrichedAds;

    if (params?.minSpend !== undefined && params.minSpend > 0) {
      const minSpend = params.minSpend;
      filtered = filtered.filter((ad) => {
        const spendVal = extractNumericValue(ad.spend);
        // Se spend não está disponível (0), não filtrar — incluir o anúncio
        return spendVal === 0 || spendVal >= minSpend;
      });
    }

    if (params?.minCTR !== undefined) {
      const minCTR = params.minCTR;
      filtered = filtered.filter((ad) => (ad.estimatedCTR || 0) >= minCTR);
    }

    if (params?.minImpressions !== undefined && params.minImpressions > 0) {
      const minImpressions = params.minImpressions;
      filtered = filtered.filter((ad) => {
        const impressionsVal = extractNumericValue(ad.impressions);
        // Se impressions não está disponível (0), não filtrar — incluir o anúncio
        return impressionsVal === 0 || impressionsVal >= minImpressions;
      });
    }

    if (params?.minDaysActive !== undefined) {
      const minDaysActive = params.minDaysActive;
      filtered = filtered.filter((ad) => (ad.daysActive || 0) >= minDaysActive);
    }

    // Ordenar por scaling score (descendente)
    return filtered.sort((a, b) => (b.scalingScore || 0) - (a.scalingScore || 0));
  } catch (error) {
    console.error("[Ad Library] Scaled ads search error:", error);
    throw error;
  }
}
