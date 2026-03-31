/**
 * Integração com Meta Marketing API
 * Busca métricas de performance de campanhas do usuário\n */

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

/**
 * Obter métricas de uma campanha específica
 */
export async function getCampaignMetrics(
  accessToken: string,
  campaignId: string,
  dateStart: string,
  dateStop: string
): Promise<CampaignMetrics | null> {
  try {
    const queryParams = new URLSearchParams({
      access_token: accessToken,
      fields: [
        "id",
        "name",
        "spend",
        "impressions",
        "clicks",
        "actions",
        "action_values",
        "ctr",
        "cpc",
        "cpm",
      ].join(","),
      time_range: JSON.stringify({
        since: dateStart,
        until: dateStop,
      }),
    });

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Marketing API] Campaign metrics error:", error);
      return null;
    }

    const data = (await response.json()) as {
      data?: Array<{
        campaign_id: string;
        campaign_name: string;
        spend: string;
        impressions: string;
        clicks: string;
        actions?: Array<{ action_type: string; value: string }>;
        action_values?: Array<{ action_type: string; value: string }>;
        ctr: string;
        cpc: string;
        cpm: string;
        currency: string;
        date_start: string;
        date_stop: string;
      }>;
    };

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const metric = data.data[0];
    const conversions = metric.actions?.reduce((sum, a) => sum + parseInt(a.value || "0"), 0) || 0;
    const conversionValue =
      metric.action_values?.reduce((sum, a) => sum + parseFloat(a.value || "0"), 0) || 0;

    return {
      campaignId: metric.campaign_id,
      campaignName: metric.campaign_name,
      spend: parseFloat(metric.spend),
      impressions: parseInt(metric.impressions),
      clicks: parseInt(metric.clicks),
      conversions,
      conversionValue,
      roas: conversionValue > 0 ? conversionValue / parseFloat(metric.spend) : 0,
      ctr: parseFloat(metric.ctr),
      cpc: parseFloat(metric.cpc),
      cpm: parseFloat(metric.cpm),
      currency: metric.currency,
      dateStart: metric.date_start,
      dateStop: metric.date_stop,
    };
  } catch (error) {
    console.error("[Marketing API] Campaign metrics error:", error);
    throw error;
  }
}

/**
 * Obter métricas de uma conta de anúncios
 */
export async function getAdAccountMetrics(
  accessToken: string,
  adAccountId: string,
  dateStart: string,
  dateStop: string
): Promise<AdAccountMetrics | null> {
  try {
    const queryParams = new URLSearchParams({
      access_token: accessToken,
      fields: [
        "spend",
        "impressions",
        "clicks",
        "actions",
        "action_values",
        "ctr",
        "cpc",
        "cpm",
        "currency",
      ].join(","),
      time_range: JSON.stringify({
        since: dateStart,
        until: dateStop,
      }),
    });

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${adAccountId}/insights?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Marketing API] Ad account metrics error:", error);
      return null;
    }

    const data = (await response.json()) as {
      data?: Array<{
        spend: string;
        impressions: string;
        clicks: string;
        actions?: Array<{ action_type: string; value: string }>;
        action_values?: Array<{ action_type: string; value: string }>;
        ctr: string;
        cpc: string;
        cpm: string;
        currency: string;
      }>;
    };

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const metric = data.data[0];
    const conversions = metric.actions?.reduce((sum, a) => sum + parseInt(a.value || "0"), 0) || 0;
    const conversionValue =
      metric.action_values?.reduce((sum, a) => sum + parseFloat(a.value || "0"), 0) || 0;
    const totalSpend = parseFloat(metric.spend);

    return {
      accountId: adAccountId,
      totalSpend,
      totalImpressions: parseInt(metric.impressions),
      totalClicks: parseInt(metric.clicks),
      totalConversions: conversions,
      totalConversionValue: conversionValue,
      averageRoas: totalSpend > 0 ? conversionValue / totalSpend : 0,
      averageCtr: parseFloat(metric.ctr),
      averageCpc: parseFloat(metric.cpc),
      averageCpm: parseFloat(metric.cpm),
      currency: metric.currency,
    };
  } catch (error) {
    console.error("[Marketing API] Ad account metrics error:", error);
    throw error;
  }
}

/**
 * Listar todas as campanhas de uma conta de anúncios
 */
export async function listCampaigns(
  accessToken: string,
  adAccountId: string
): Promise<Array<{ id: string; name: string; status: string }>> {
  try {
    const queryParams = new URLSearchParams({
      access_token: accessToken,
      fields: "id,name,status",
      limit: "100",
    });

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Marketing API] List campaigns error:", error);
      return [];
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        name: string;
        status: string;
      }>;
    };

    return data.data || [];
  } catch (error) {
    console.error("[Marketing API] List campaigns error:", error);
    throw error;
  }
}
