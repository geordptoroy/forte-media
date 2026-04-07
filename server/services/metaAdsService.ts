import axios from "axios";
import { logger } from "../_core/logger";

/**
 * Meta Ads Archive API Service
 * Refactored with real-time event tracing and robust error handling.
 */

export interface AdsArchiveSearchParams {
  userId: number; // Added for event tracing
  accessToken: string;
  adReachedCountries: string[];
  searchTerms?: string;
  searchPageIds?: string[];
  adType?: "ALL" | "POLITICAL_AND_ISSUE_ADS" | "CREDIT_ADS" | "EMPLOYMENT_ADS" | "HOUSING_ADS";
  adActiveStatus?: "ACTIVE" | "INACTIVE" | "ALL";
  adDeliveryDateMin?: string;
  adDeliveryDateMax?: string;
  fields?: string[];
  limit?: number;
  after?: string;
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
  spend?: { min?: number; max?: number; range?: string };
  impressions?: { min?: number; max?: number; range?: string };
  media_type?: string;
}

const META_API_VERSION = "v21.0";
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const ADS_ARCHIVE_ENDPOINT = `${META_API_BASE_URL}/ads_archive`;

const DEFAULT_FIELDS = [
  "id", "page_id", "page_name", "ad_snapshot_url",
  "ad_delivery_start_time", "ad_delivery_stop_time",
  "publisher_platforms", "ad_creative_bodies",
  "ad_creative_link_titles", "ad_creative_link_descriptions",
  "currency", "spend", "impressions", "media_type",
];

export async function searchAdsArchive(params: AdsArchiveSearchParams): Promise<AdsArchiveResponse> {
  const startTime = Date.now();
  const { userId, accessToken, ...searchParams } = params;

  if (!accessToken) throw new Error("Access token is required");
  if (!searchParams.adReachedCountries?.length) throw new Error("At least one country is required");

  const normalizedSearchTerms = searchParams.searchTerms?.trim();
  const effectiveSearchTerms = (normalizedSearchTerms === "" || normalizedSearchTerms === "*") ? "." : normalizedSearchTerms;

  // Trace Request
  logger.traceMeta({
    userId,
    timestamp: new Date().toISOString(),
    type: "request",
    service: "ad_library",
    action: "search_ads",
    payload: { countries: searchParams.adReachedCountries, terms: effectiveSearchTerms },
  });

  const queryParams: Record<string, any> = {
    access_token: accessToken,
    ad_reached_countries: JSON.stringify(searchParams.adReachedCountries),
    fields: (searchParams.fields || DEFAULT_FIELDS).join(","),
    limit: searchParams.limit || 100,
  };

  if (effectiveSearchTerms) queryParams.search_terms = effectiveSearchTerms;
  if (searchParams.searchPageIds) queryParams.search_page_ids = JSON.stringify(searchParams.searchPageIds);
  if (searchParams.adType) queryParams.ad_type = searchParams.adType;
  if (searchParams.adActiveStatus) queryParams.ad_active_status = searchParams.adActiveStatus;
  if (searchParams.after) queryParams.after = searchParams.after;

  try {
    const response = await axios.get<AdsArchiveResponse>(ADS_ARCHIVE_ENDPOINT, {
      params: queryParams,
      timeout: 30000,
    });

    const duration = Date.now() - startTime;

    // Trace Response
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "response",
      service: "ad_library",
      action: "search_ads",
      payload: { count: response.data.data?.length || 0 },
      duration,
    });

    return response.data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const metaError = error.response?.data?.error;
    const errorMessage = metaError?.message || error.message || "Unknown error";

    // Trace Error
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "error",
      service: "ad_library",
      action: "search_ads",
      payload: { error: errorMessage, code: metaError?.code },
      duration,
    });

    throw new Error(`Meta API Error: ${errorMessage}`);
  }
}

export async function searchAdsByKeywords(
  userId: number,
  accessToken: string,
  keywords: string,
  countries: string[] = ["BR"],
  options?: Partial<AdsArchiveSearchParams>
): Promise<AdsArchiveResponse> {
  return searchAdsArchive({
    userId,
    accessToken,
    adReachedCountries: countries,
    searchTerms: keywords,
    ...options,
  });
}

export async function searchAdsByPages(
  userId: number,
  accessToken: string,
  pageIds: string[],
  countries: string[] = ["BR"],
  options?: Partial<AdsArchiveSearchParams>
): Promise<AdsArchiveResponse> {
  return searchAdsArchive({
    userId,
    accessToken,
    adReachedCountries: countries,
    searchPageIds: pageIds,
    ...options,
  });
}
