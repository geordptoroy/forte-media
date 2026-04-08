/**
 * Meta Ad Library API Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Serviço de busca na Meta Ad Library — sem nenhuma lógica proprietária.
 * Apenas repassa os parâmetros para a API oficial da Meta e retorna os dados.
 */
import { searchAdsArchive } from "./services/metaAdsService";
import { logger } from "./_core/logger";

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
  ad_reached_countries?: string[];
}

export interface AdLibrarySearchParams {
  userId: number;
  searchTerms?: string;
  searchPageIds?: string[];
  countries: string[];
  adType?: "ALL" | "POLITICAL_AND_ISSUE_ADS" | "CREDIT_ADS" | "EMPLOYMENT_ADS" | "HOUSING_ADS";
  adActiveStatus?: "ACTIVE" | "INACTIVE" | "ALL";
  adDeliveryDateMin?: string;
  adDeliveryDateMax?: string;
  mediaType?: string;
  publisherPlatforms?: string[];
  limit?: number;
  after?: string;
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
  const {
    userId,
    searchTerms,
    searchPageIds,
    countries,
    adType,
    adActiveStatus,
    adDeliveryDateMin,
    adDeliveryDateMax,
    mediaType,
    publisherPlatforms,
    limit,
    after,
  } = params;

  try {
    const result = await searchAdsArchive({
      userId,
      accessToken,
      adReachedCountries: countries,
      searchTerms: searchTerms || ".",
      searchPageIds,
      adType,
      adActiveStatus: adActiveStatus || "ALL",
      adDeliveryDateMin,
      adDeliveryDateMax,
      mediaType,
      publisherPlatforms,
      limit: limit || 25,
      after,
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
        "ad_creative_images",
        "ad_creative_videos",
        "currency",
        "spend",
        "impressions",
        "media_type",
        "ad_reached_countries",
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
        ad_creative_images: ad.ad_creative_images ?? [],
        ad_creative_videos: ad.ad_creative_videos ?? [],
        currency: ad.currency,
        spend: ad.spend ?? null,
        impressions: ad.impressions ?? null,
        media_type: ad.media_type,
        ad_reached_countries: ad.ad_reached_countries,
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
