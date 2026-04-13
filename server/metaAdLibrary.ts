/**
 * Meta Ad Library API Service — Unified Refactor
 */
import { fetchAdsArchive, META_ADS_FIELDS } from "./services/metaAdsService";
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
  ad_creative_link_captions?: string[];
  currency?: string;
  spend?: any;
  impressions?: any;
  estimated_audience_size?: any;
  demographic_distribution?: any;
  delivery_by_region?: any;
  languages?: string[];
  ad_reached_countries?: string[];
}

export interface AdLibrarySearchParams {
  userId: number;
  searchTerms?: string;
  searchPageIds?: string[];
  countries: string[];
  adType?: string;
  adActiveStatus?: string;
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

/**
 * Função principal de busca unificada
 */
export async function searchAdLibrary(
  accessToken: string,
  params: AdLibrarySearchParams
): Promise<AdLibrarySearchResult> {
  try {
    const result = await fetchAdsArchive({
      accessToken,
      searchTerms: params.searchTerms,
      searchPageIds: params.searchPageIds,
      adReachedCountries: params.countries,
      adType: params.adType,
      adActiveStatus: params.adActiveStatus,
      adDeliveryDateMin: params.adDeliveryDateMin,
      adDeliveryDateMax: params.adDeliveryDateMax,
      mediaType: params.mediaType,
      publisherPlatforms: params.publisherPlatforms,
      limit: params.limit,
      after: params.after,
      fields: META_ADS_FIELDS
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
        ad_creative_link_captions: ad.ad_creative_link_captions,
        currency: ad.currency,
        spend: ad.spend,
        impressions: ad.impressions,
        estimated_audience_size: ad.estimated_audience_size,
        demographic_distribution: ad.demographic_distribution,
        delivery_by_region: ad.delivery_by_region,
        languages: ad.languages,
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
    logger.error(`[AdLibrary] Erro na busca unificada para usuário ${params.userId}:`, error);
    throw error;
  }
}
