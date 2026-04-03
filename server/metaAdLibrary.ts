/**
 * Integração com Meta Ad Library API
 * Busca anúncios competitivos com análise avançada de escalabilidade
 */

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

export interface AdLibraryAd {
  id: string;
  pageId: string;
  pageName: string;
  adCreativeBodies: string[];
  adCreativeLinkCaptions: string[];
  adDeliveryStartTime: string;
  adDeliveryStopTime: string;
  adSnapshotUrl: string;
  spend: string;
  impressions: number;
  currency: string;
  mediaType?: string;
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

// Versão da API Graph — atualizada para v21.0
const GRAPH_API_VERSION = "v21.0";

/**
 * Buscar anúncios na Ad Library
 */
export async function searchAdLibrary(
  accessToken: string,
  params: AdLibrarySearchParams
): Promise<AdLibrarySearchResult> {
  try {
    // Construir search_terms corretamente: espaço = AND, vírgula = OR
    // A Meta Ad Library exige um termo não vazio; usamos "." como curinga genérico
    const rawTerms = params.searchTerms.join(" ").trim();
    const searchTermsFormatted = rawTerms === "" || rawTerms === "*" ? "." : rawTerms;

    const queryParams = new URLSearchParams({
      access_token: accessToken,
      search_terms: searchTermsFormatted,
      ad_reached_countries: JSON.stringify(params.countries),
      ad_type: params.adType || "ALL",
      limit: String(params.limit || 25),
      fields: [
        "id",
        "page_id",
        "page_name",
        "ad_creative_bodies",
        "ad_creative_link_captions",
        "ad_delivery_start_time",
        "ad_delivery_stop_time",
        "ad_snapshot_url",
        "spend",
        "impressions",
        "currency",
        "media_type",
      ].join(","),
    });

    if (params.after) {
      queryParams.append("after", params.after);
    }

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/ads_archive?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json() as { error?: { message?: string; code?: number } };
      const msg = error?.error?.message || `HTTP ${response.status}`;
      console.error("[Ad Library] API error:", error);
      throw new Error(`Ad Library API error: ${msg}`);
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        page_id: string;
        page_name: string;
        ad_creative_bodies?: string[];
        ad_creative_link_captions?: string[];
        ad_delivery_start_time: string;
        ad_delivery_stop_time: string;
        ad_snapshot_url: string;
        spend: string;
        impressions: number;
        currency: string;
        media_type?: string;
      }>;
      paging?: {
        cursors: {
          before: string;
          after: string;
        };
      };
    };

    return {
      ads: (data.data || []).map((ad) => ({
        id: ad.id,
        pageId: ad.page_id,
        pageName: ad.page_name,
        adCreativeBodies: ad.ad_creative_bodies || [],
        adCreativeLinkCaptions: ad.ad_creative_link_captions || [],
        adDeliveryStartTime: ad.ad_delivery_start_time,
        adDeliveryStopTime: ad.ad_delivery_stop_time,
        adSnapshotUrl: ad.ad_snapshot_url,
        spend: ad.spend,
        impressions: ad.impressions,
        currency: ad.currency,
        mediaType: ad.media_type,
      })),
      paging: data.paging || { cursors: { before: "", after: "" } },
    };
  } catch (error) {
    console.error("[Ad Library] Search error:", error);
    throw error;
  }
}

/**
 * Calcular dias ativos de um anúncio
 */
function calculateDaysActive(startTime: string, stopTime?: string): number {
  try {
    const start = new Date(startTime).getTime();
    const end = stopTime ? new Date(stopTime).getTime() : Date.now();
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
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
 */
function analyzeScaling(ad: AdLibraryAd): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const spend = parseFloat(ad.spend) || 0;
  const impressions = ad.impressions || 0;
  const daysActive = calculateDaysActive(ad.adDeliveryStartTime, ad.adDeliveryStopTime);
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
    score += 10;
    reasons.push(`Ativo por ${daysActive} dias (consistência)`);
  } else if (daysActive >= 7) {
    score += 5;
    reasons.push(`Ativo por ${daysActive} dias`);
  }

  // Critério 6: Tipo de mídia (vídeos tendem a escalar melhor)
  if (ad.mediaType === "VIDEO") {
    score += 5;
    reasons.push("Formato de vídeo (melhor engajamento)");
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Buscar anúncios escalados (alto desempenho)
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
      const daysActive = calculateDaysActive(ad.adDeliveryStartTime, ad.adDeliveryStopTime);
      const cpm = calculateCPM(parseFloat(ad.spend) || 0, ad.impressions || 0);
      const estimatedCTR = estimateCTR(ad.impressions || 0, parseFloat(ad.spend) || 0);
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
    let filtered = enrichedAds;

    if (params?.minSpend !== undefined) {
      const minSpend = params.minSpend;
      filtered = filtered.filter((ad) => parseFloat(ad.spend) >= minSpend);
    }

    if (params?.minCTR !== undefined) {
      const minCTR = params.minCTR;
      filtered = filtered.filter((ad) => (ad.estimatedCTR || 0) >= minCTR);
    }

    if (params?.minROAS !== undefined) {
      const minROAS = params.minROAS;
      filtered = filtered.filter((ad) => {
        const estimatedRevenue = (ad.impressions || 0) / 1000;
        const spend = parseFloat(ad.spend) || 1;
        const roas = estimatedRevenue / spend;
        return roas >= minROAS;
      });
    }

    if (params?.minImpressions !== undefined) {
      const minImpressions = params.minImpressions;
      filtered = filtered.filter((ad) => ad.impressions >= minImpressions);
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
