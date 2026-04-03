import axios from "axios";

/**
 * Meta Ads Archive API Service
 * Handles all interactions with Meta's ads_archive endpoint
 * Documentation: https://developers.facebook.com/docs/marketing-api/reference/ads-archive
 */

export interface AdsArchiveSearchParams {
  accessToken: string;
  adReachedCountries: string[]; // ISO-3166-1 Alpha-2 codes (e.g., ['BR', 'US'])
  searchTerms?: string;
  searchPageIds?: string[]; // Up to 10 page IDs
  adType?: "ALL" | "POLITICAL_AND_ISSUE_ADS" | "CREDIT_ADS" | "EMPLOYMENT_ADS" | "HOUSING_ADS";
  adActiveStatus?: "ACTIVE" | "INACTIVE" | "ALL";
  adDeliveryDateMin?: string; // YYYY-MM-DD
  adDeliveryDateMax?: string; // YYYY-MM-DD
  fields?: string[];
  limit?: number; // 1-1000, default 100
  after?: string; // Pagination cursor
}

export interface AdsArchiveResponse {
  data: AdRecord[];
  paging?: {
    cursors?: {
      after?: string;
      before?: string;
    };
  };
}

export interface AdRecord {
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
  spend?: {
    min?: number;
    max?: number;
    range?: string;
  };
  impressions?: {
    min?: number;
    max?: number;
    range?: string;
  };
  demographic_distribution?: Record<string, number>;
  region_distribution?: Record<string, number>;
  beneficiary_payers?: Array<{
    beneficiary?: string;
    payer?: string;
  }>;
  delivery_by_region?: Record<string, any>;
}

const META_API_BASE_URL = "https://graph.facebook.com/v19.0";
const ADS_ARCHIVE_ENDPOINT = `${META_API_BASE_URL}/ads_archive`;

/**
 * Default fields to request from the ads_archive API
 * Optimized for Brazilian market (common ads don't have spend/impressions)
 */
const DEFAULT_FIELDS = [
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
];

export async function searchAdsArchive(params: AdsArchiveSearchParams): Promise<AdsArchiveResponse> {
  if (!params.accessToken) {
    throw new Error("Access token is required");
  }

  if (!params.adReachedCountries || params.adReachedCountries.length === 0) {
    throw new Error("At least one country code (ad_reached_countries) is required");
  }

  if (!params.searchTerms && (!params.searchPageIds || params.searchPageIds.length === 0)) {
    throw new Error("Either search_terms or search_page_ids must be provided");
  }

  if (params.searchPageIds && params.searchPageIds.length > 10) {
    throw new Error("Maximum 10 page IDs allowed in search_page_ids");
  }

  const queryParams: Record<string, any> = {
    access_token: params.accessToken,
    ad_reached_countries: JSON.stringify(params.adReachedCountries),
    fields: (params.fields || DEFAULT_FIELDS).join(","),
    limit: params.limit || 100,
  };

  if (params.searchTerms) {
    queryParams.search_terms = params.searchTerms;
  }

  if (params.searchPageIds) {
    queryParams.search_page_ids = JSON.stringify(params.searchPageIds);
  }

  if (params.adType) {
    queryParams.ad_type = params.adType;
  }

  if (params.adActiveStatus) {
    queryParams.ad_active_status = params.adActiveStatus;
  }

  if (params.adDeliveryDateMin) {
    queryParams.ad_delivery_date_min = params.adDeliveryDateMin;
  }

  if (params.adDeliveryDateMax) {
    queryParams.ad_delivery_date_max = params.adDeliveryDateMax;
  }

  if (params.after) {
    queryParams.after = params.after;
  }

  try {
    const response = await axios.get<AdsArchiveResponse>(ADS_ARCHIVE_ENDPOINT, {
      params: queryParams,
      timeout: 30000, // 30 seconds timeout
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      const metaError = error.response.data.error;
      throw new Error(`Meta API Error: ${metaError.message || JSON.stringify(metaError)}`);
    }
    throw new Error(`Failed to search ads archive: ${error.message}`);
  }
}

/**
 * Search ads by keywords
 */
export async function searchAdsByKeywords(
  accessToken: string,
  keywords: string,
  countries: string[] = ["BR"],
  options?: Partial<AdsArchiveSearchParams>
): Promise<AdsArchiveResponse> {
  return searchAdsArchive({
    accessToken,
    adReachedCountries: countries,
    searchTerms: keywords,
    ...options,
  });
}

/**
 * Search ads from specific Facebook pages
 */
export async function searchAdsByPages(
  accessToken: string,
  pageIds: string[],
  countries: string[] = ["BR"],
  options?: Partial<AdsArchiveSearchParams>
): Promise<AdsArchiveResponse> {
  return searchAdsArchive({
    accessToken,
    adReachedCountries: countries,
    searchPageIds: pageIds,
    ...options,
  });
}

/**
 * Validate if an access token is valid
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me`, {
      params: {
        access_token: accessToken,
        fields: "id,name",
      },
      timeout: 10000,
    });
    return !!response.data?.id;
  } catch (error) {
    return false;
  }
}
