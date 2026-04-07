/**
 * Meta Ad Library API Service — v2 (Refatorado)
 * ─────────────────────────────────────────────────────────────────────────────
 * Servico principal de busca na Meta Ad Library.
 *
 * Mudancas v2:
 *  - Adicionados campos ad_creative_images e ad_creative_videos na requisicao
 *    para permitir exibicao de thumbnails diretamente da API (sem scraping)
 *  - Removida funcao analyzeScaling() duplicada — toda logica de escala agora
 *    passa pelo scalingValidationService centralizado
 *  - Mapeamento de ad_creative_images e ad_creative_videos no retorno
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
  ad_creative_images?: Array<{ url: string; width?: number; height?: number }>;
  ad_creative_videos?: Array<{ url?: string; thumbnail_url?: string }>;
  currency?: string;
  spend?: { range?: string; min?: number; max?: number } | string | null;
  impressions?: { range?: string; min?: number; max?: number } | string | null;
  media_type?: string;
  scalingScore?: number;
  scalingReasons?: string[];
  daysActive?: number;
  estimatedCPM?: number;
  estimatedCTR?: number;
  // Campos adicionados pelo scalingValidationService
  scaleLevel?: string;
  isScaled?: boolean;
  confidence?: string;
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
        // Campos de imagem/video — essenciais para thumbnails sem scraping
        "ad_creative_images",
        "ad_creative_videos",
        "currency",
        "spend",
        "impressions",
        "media_type",
      ],
    });

    return {
      ads: (result.data || []).map((ad: any) => ({
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
        // Imagens e videos diretos da API
        ad_creative_images: ad.ad_creative_images ?? [],
        ad_creative_videos: ad.ad_creative_videos ?? [],
        currency: ad.currency,
        spend: ad.spend ?? null,
        impressions: ad.impressions ?? null,
        media_type: ad.media_type as string | undefined,
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
    logger.error("[Ad Library] Search error for user " + userId + ":", error);
    throw error;
  }
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
    logger.error("[Ad Library] Scaled ads search error for user " + userId + ":", error);
    throw error;
  }
}
