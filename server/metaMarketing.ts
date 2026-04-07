import axios from "axios";
import { logger } from "./_core/logger";

/**
 * Meta Marketing API Service
 * Refactored with real-time event tracing and robust error handling.
 */

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
  currency: string;
  dateStart: string;
  dateStop: string;
}

export interface AdAccountMetrics {
  accountId: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalConversionValue: number;
  averageRoas: number;
  averageCtr: number;
  averageCpc: number;
  averageCpm: number;
  currency: string;
}

const META_API_VERSION = "v21.0";
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Get insights for a specific campaign.
 */
export async function getCampaignMetrics(
  userId: number,
  accessToken: string,
  campaignId: string,
  dateStart: string,
  dateStop: string
): Promise<CampaignMetrics | null> {
  const startTime = Date.now();

  // Trace Request
  logger.traceMeta({
    userId,
    timestamp: new Date().toISOString(),
    type: "request",
    service: "marketing_api",
    action: "get_campaign_insights",
    payload: { campaignId, dateStart, dateStop },
  });

  try {
    const response = await axios.get(`${META_API_BASE_URL}/${campaignId}/insights`, {
      params: {
        access_token: accessToken,
        fields: "id,name,spend,impressions,clicks,actions,action_values,ctr,cpc,cpm,currency,date_start,date_stop",
        time_range: JSON.stringify({ since: dateStart, until: dateStop }),
      },
      timeout: 20000,
    });

    const duration = Date.now() - startTime;
    const data = response.data?.data?.[0];

    if (!data) {
      logger.traceMeta({
        userId,
        timestamp: new Date().toISOString(),
        type: "response",
        service: "marketing_api",
        action: "get_campaign_insights",
        payload: { empty: true },
        duration,
      });
      return null;
    }

    const conversions = data.actions?.reduce((sum: number, a: any) => sum + parseInt(a.value || "0"), 0) || 0;
    const conversionValue = data.action_values?.reduce((sum: number, a: any) => sum + parseFloat(a.value || "0"), 0) || 0;
    const spend = parseFloat(data.spend || "0");

    const result: CampaignMetrics = {
      campaignId: data.campaign_id || data.id,
      campaignName: data.campaign_name || data.name,
      spend,
      impressions: parseInt(data.impressions || "0"),
      clicks: parseInt(data.clicks || "0"),
      conversions,
      conversionValue,
      roas: spend > 0 ? conversionValue / spend : 0,
      ctr: parseFloat(data.ctr || "0"),
      cpc: parseFloat(data.cpc || "0"),
      cpm: parseFloat(data.cpm || "0"),
      currency: data.currency || "USD",
      dateStart: data.date_start,
      dateStop: data.date_stop,
    };

    // Trace Response
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "response",
      service: "marketing_api",
      action: "get_campaign_insights",
      payload: { spend: result.spend, roas: result.roas },
      duration,
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const metaError = error.response?.data?.error;
    const errorMessage = metaError?.message || error.message || "Unknown error";

    // Trace Error
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "error",
      service: "marketing_api",
      action: "get_campaign_insights",
      payload: { error: errorMessage, code: metaError?.code },
      duration,
    });

    return null;
  }
}

/**
 * Get insights for an ad account.
 */
export async function getAdAccountMetrics(
  userId: number,
  accessToken: string,
  adAccountId: string,
  dateStart: string,
  dateStop: string
): Promise<AdAccountMetrics | null> {
  const startTime = Date.now();

  // Trace Request
  logger.traceMeta({
    userId,
    timestamp: new Date().toISOString(),
    type: "request",
    service: "marketing_api",
    action: "get_account_insights",
    payload: { adAccountId, dateStart, dateStop },
  });

  try {
    const response = await axios.get(`${META_API_BASE_URL}/${adAccountId}/insights`, {
      params: {
        access_token: accessToken,
        fields: "spend,impressions,clicks,actions,action_values,ctr,cpc,cpm,currency",
        time_range: JSON.stringify({ since: dateStart, until: dateStop }),
      },
      timeout: 20000,
    });

    const duration = Date.now() - startTime;
    const data = response.data?.data?.[0];

    if (!data) {
      logger.traceMeta({
        userId,
        timestamp: new Date().toISOString(),
        type: "response",
        service: "marketing_api",
        action: "get_account_insights",
        payload: { empty: true },
        duration,
      });
      return null;
    }

    const conversions = data.actions?.reduce((sum: number, a: any) => sum + parseInt(a.value || "0"), 0) || 0;
    const conversionValue = data.action_values?.reduce((sum: number, a: any) => sum + parseFloat(a.value || "0"), 0) || 0;
    const totalSpend = parseFloat(data.spend || "0");

    const result: AdAccountMetrics = {
      accountId: adAccountId,
      totalSpend,
      totalImpressions: parseInt(data.impressions || "0"),
      totalClicks: parseInt(data.clicks || "0"),
      totalConversions: conversions,
      totalConversionValue: conversionValue,
      averageRoas: totalSpend > 0 ? conversionValue / totalSpend : 0,
      averageCtr: parseFloat(data.ctr || "0"),
      averageCpc: parseFloat(data.cpc || "0"),
      averageCpm: parseFloat(data.cpm || "0"),
      currency: data.currency || "USD",
    };

    // Trace Response
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "response",
      service: "marketing_api",
      action: "get_account_insights",
      payload: { totalSpend: result.totalSpend, totalConversions: result.totalConversions },
      duration,
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const metaError = error.response?.data?.error;
    const errorMessage = metaError?.message || error.message || "Unknown error";

    // Trace Error
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "error",
      service: "marketing_api",
      action: "get_account_insights",
      payload: { error: errorMessage, code: metaError?.code },
      duration,
    });

    return null;
  }
}

/**
 * List all campaigns for an ad account.
 */
export async function listCampaigns(
  userId: number,
  accessToken: string,
  adAccountId: string
): Promise<Array<{ id: string; name: string; status: string }>> {
  const startTime = Date.now();

  // Trace Request
  logger.traceMeta({
    userId,
    timestamp: new Date().toISOString(),
    type: "request",
    service: "marketing_api",
    action: "list_campaigns",
    payload: { adAccountId },
  });

  try {
    const response = await axios.get(`${META_API_BASE_URL}/${adAccountId}/campaigns`, {
      params: {
        access_token: accessToken,
        fields: "id,name,status",
        limit: 100,
      },
      timeout: 20000,
    });

    const duration = Date.now() - startTime;
    const campaigns = response.data?.data || [];

    // Trace Response
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "response",
      service: "marketing_api",
      action: "list_campaigns",
      payload: { count: campaigns.length },
      duration,
    });

    return campaigns;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const metaError = error.response?.data?.error;
    const errorMessage = metaError?.message || error.message || "Unknown error";

    // Trace Error
    logger.traceMeta({
      userId,
      timestamp: new Date().toISOString(),
      type: "error",
      service: "marketing_api",
      action: "list_campaigns",
      payload: { error: errorMessage, code: metaError?.code },
      duration,
    });

    return [];
  }
}
