/**
 * Meta Ad Library API Service
 * Refactored with real-time event tracing and robust error handling.
 */

import { searchAdsArchive } from "./services/metaAdsService";
import { validateAdScaling } from "./services/scalingValidationService";
import { logger } from "./_core/logger";

export interface AdLibrarySearchParams {
  userId: number;
  searchTerms: string[];
  countries: string[];
  adType?: "POLITICAL" | "ISSUE_ADS" | "ALL";
  limit?: number;
  after?: string;
}

export interface ScalingAnalysisParams {
  searchTerms?: string;
  minSpend?: number;
  minCTR?: number;
  minROAS?: number;
  minImpressions?: number;
  minDaysActive?: number;
}

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

export async function searchAdLibrary(
  accessToken: string,
  params: AdLibrarySearchParams
): Promise<AdLibrarySearchResult> {
  const { userId, searchTerms, countries, adType, limit, after } = params;

  try {
    const rawTerms = searchTerms.join(" ").trim();
    const searchTermsFormatted = rawTerms === "" || rawTerms === "*" ? "." : rawTerms;

    const result = await searchAdsArchive({
      userId,
      accessToken,
      adReachedCountries: countries,
      searchTerms: searchTermsFormatted,
      adType: adType === "ALL" ? "ALL" : undefined,
      limit: limit || 25,
      after: after,
      fields: [
        "id", "page_id", "page_name", "ad_snapshot_url",
        "ad_delivery_start_time", "ad_delivery_stop_time",
        "publisher_platforms", "ad_creative_bodies",
        "ad_creative_link_titles", "ad_creative_link_descriptions",
        "currency", "spend", "impressions", "media_type",
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
        media_type: (ad as any).media_type as string | undefined,
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
    logger.error(`[Ad Library] Search error for user ${userId}:`, error);
    throw error;
  }
}

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

function extractNumericValue(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object") {
    const min = value.min ?? 0;
    const max = value.max ?? 0;
    if (min > 0 || max > 0) return (min + max) / 2;
    if (value.range) {
      const parts = value.range.split("-").map((p: string) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return (parts[0] + parts[1]) / 2;
      return parseFloat(value.range) || 0;
    }
  }
  return 0;
}

function analyzeScaling(ad: AdLibraryAd): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const spend = extractNumericValue(ad.spend);
  const impressions = extractNumericValue(ad.impressions);
  const daysActive = calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);

  if (spend >= 100) { score += 20; reasons.push(`Gasto significativo: $${spend.toFixed(2)}`); }
  if (impressions >= 10000) { score += 20; reasons.push(`Alcance elevado: ${impressions.toLocaleString()} impressões`); }
  
  if (daysActive >= 30) { score += 20; reasons.push(`Ativo por ${daysActive} dias (consistência alta)`); }
  else if (daysActive >= 14) { score += 15; reasons.push(`Ativo por ${daysActive} dias (consistência boa)`); }
  else if (daysActive >= 7) { score += 10; reasons.push(`Ativo por ${daysActive} dias`); }

  if (ad.media_type === "VIDEO") { score += 10; reasons.push("Formato de vídeo (melhor engajamento)"); }
  if (ad.publisher_platforms && ad.publisher_platforms.length >= 3) { score += 10; reasons.push(`Veiculado em ${ad.publisher_platforms.length} plataformas`); }
  if (ad.ad_creative_bodies?.length) { score += 5; reasons.push("Criativo com copy definido"); }

  return { score: Math.min(100, score), reasons };
}

export async function searchScaledAds(
  userId: number,
  accessToken: string,
  countries: string[],
  params?: ScalingAnalysisParams
): Promise<AdLibraryAd[]> {
  try {
    const result = await searchAdLibrary(accessToken, {
      userId,
      searchTerms: params?.searchTerms ? [params.searchTerms] : ["."],
      countries,
      adType: "ALL",
      limit: 100,
    });

    const enrichedAds = result.ads.map((ad) => {
      // Usa a engine de validação centralizada
      const validation = validateAdScaling(ad);
      return {
        ...ad,
        daysActive: validation.rawMetrics.daysActive,
        scalingScore: validation.scalingScore,
        scalingReasons: validation.signals.filter(s => s.passed).map(s => s.description),
        scaleLevel: validation.scaleLevel,
        isScaled: validation.isScaled,
        confidence: validation.confidence,
      };
    });

    return enrichedAds.sort((a, b) => (b.scalingScore || 0) - (a.scalingScore || 0));
  } catch (error) {
    logger.error(`[Ad Library] Scaled ads search error for user ${userId}:`, error);
    throw error;
  }
}
