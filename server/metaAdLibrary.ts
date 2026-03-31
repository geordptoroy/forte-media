/**
 * Integração com Meta Ad Library API
 * Busca anúncios competitivos de forma segura
 */

export interface AdLibrarySearchParams {
  searchTerms: string[];
  countries: string[];
  adType?: "POLITICAL" | "ISSUE_ADS" | "ALL";
  limit?: number;
  after?: string;
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
 * Buscar anúncios na Ad Library
 */
export async function searchAdLibrary(
  accessToken: string,
  params: AdLibrarySearchParams
): Promise<AdLibrarySearchResult> {
  try {
    const queryParams = new URLSearchParams({
      access_token: accessToken,
      search_terms: JSON.stringify(params.searchTerms),
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
      ].join(","),
    });

    if (params.after) {
      queryParams.append("after", params.after);
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/ads_archive?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Ad Library] API error:", error);
      throw new Error(`Ad Library API error: ${response.status}`);
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
      })),
      paging: data.paging || { cursors: { before: "", after: "" } },
    };
  } catch (error) {
    console.error("[Ad Library] Search error:", error);
    throw error;
  }
}

/**
 * Buscar anúncios escalados (alto gasto e impressões)
 */
export async function searchScaledAds(
  accessToken: string,
  countries: string[],
  minSpend?: number
): Promise<AdLibraryAd[]> {
  try {
    const result = await searchAdLibrary(accessToken, {
      searchTerms: ["*"],
      countries,
      adType: "ALL",
      limit: 100,
    });

    // Filtrar por gasto mínimo se especificado
    if (minSpend) {
      return result.ads.filter((ad) => {
        const spend = parseFloat(ad.spend);
        return spend >= minSpend;
      });
    }

    return result.ads;
  } catch (error) {
    console.error("[Ad Library] Scaled ads search error:", error);
    throw error;
  }
}
