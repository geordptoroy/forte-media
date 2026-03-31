import axios from 'axios';
import { config } from '../config';
import { encryptToken, decryptToken, hashToken } from './crypto';
import { storeMetaCredentials, getMetaCredentials, validateMetaToken } from './metaCredentials';

const META_API_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Buscar anúncios competitivos via Meta Ad Library API
 */
export async function searchAds(params: {
  search_terms?: string;
  ad_reached_countries?: string[];
  ad_type?: string;
  limit?: number;
  after?: string;
  accessToken?: string;
}) {
  try {
    const token = params.accessToken || config.meta.apiKey;
    
    if (!token) {
      throw new Error('Access Token não configurado');
    }

    const response = await axios.get(`${META_API_BASE}/ads_archive`, {
      params: {
        access_token: token,
        fields: [
          'id',
          'page_id',
          'page_name',
          'ad_creative_bodies',
          'ad_creative_link_captions',
          'ad_delivery_start_time',
          'ad_delivery_stop_time',
          'ad_snapshot_url',
          'spend',
          'impressions',
          'currency',
        ].join(','),
        search_terms: params.search_terms,
        ad_reached_countries: params.ad_reached_countries?.join(','),
        ad_type: params.ad_type,
        limit: params.limit || 25,
        after: params.after,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('[Meta Ad Library API] Error:', error);
    throw error;
  }
}

/**
 * Buscar anúncios escalados (alto gasto e impressões)
 */
export async function searchScaledAds(params: {
  ad_reached_countries?: string[];
  min_spend?: number;
  min_impressions?: number;
  accessToken?: string;
}) {
  try {
    const token = params.accessToken || config.meta.apiKey;
    
    if (!token) {
      throw new Error('Access Token não configurado');
    }

    const response = await axios.get(`${META_API_BASE}/ads_archive`, {
      params: {
        access_token: token,
        fields: [
          'id',
          'page_id',
          'page_name',
          'ad_creative_bodies',
          'ad_snapshot_url',
          'spend',
          'impressions',
          'currency',
        ].join(','),
        ad_reached_countries: params.ad_reached_countries?.join(','),
        limit: 100,
      },
    });
    
    // Filtrar por gasto e impressões mínimas
    const scaled = response.data.data?.filter((ad: any) => {
      const spend = parseFloat(ad.spend || '0');
      const impressions = parseInt(ad.impressions || '0');
      return spend >= (params.min_spend || 1000) && impressions >= (params.min_impressions || 10000);
    }) || [];
    
    return { data: scaled, paging: response.data.paging };
  } catch (error) {
    console.error('[Meta Scaled Ads API] Error:', error);
    throw error;
  }
}

/**
 * Obter detalhes de um anúncio específico
 */
export async function getAdDetails(adId: string, accessToken?: string) {
  try {
    const token = accessToken || config.meta.apiKey;
    
    if (!token) {
      throw new Error('Access Token não configurado');
    }

    const response = await axios.get(`${META_API_BASE}/${adId}`, {
      params: {
        access_token: token,
        fields: 'id,page_id,page_name,ad_snapshot_url,spend,impressions,currency',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('[Meta Get Ad Details API] Error:', error);
    throw error;
  }
}

/**
 * Obter métricas de uma campanha via Marketing API
 */
export async function getCampaignMetrics(campaignId: string, accessToken?: string) {
  try {
    const token = accessToken || config.meta.apiKey;
    
    if (!token) {
      throw new Error('Access Token não configurado');
    }

    const response = await axios.get(`${META_API_BASE}/${campaignId}/insights`, {
      params: {
        access_token: token,
        fields: 'campaign_id,campaign_name,spend,impressions,clicks,cpc,cpm,ctr,reach,actions',
        time_range: JSON.stringify({ since: '2024-01-01', until: '2024-12-31' }),
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('[Meta Campaign Metrics API] Error:', error);
    throw error;
  }
}

/**
 * Obter métricas de uma conta de anúncios
 */
export async function getAdAccountMetrics(accountId: string, accessToken?: string) {
  try {
    const token = accessToken || config.meta.apiKey;
    
    if (!token) {
      throw new Error('Access Token não configurado');
    }

    const response = await axios.get(`${META_API_BASE}/${accountId}/insights`, {
      params: {
        access_token: token,
        fields: 'account_id,account_name,spend,impressions,clicks,cpc,cpm,ctr,reach',
        time_range: JSON.stringify({ since: '2024-01-01', until: '2024-12-31' }),
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('[Meta Ad Account Metrics API] Error:', error);
    throw error;
  }
}

/**
 * Listar campanhas de uma conta
 */
export async function listCampaigns(accountId: string, accessToken?: string) {
  try {
    const token = accessToken || config.meta.apiKey;
    
    if (!token) {
      throw new Error('Access Token não configurado');
    }

    const response = await axios.get(`${META_API_BASE}/${accountId}/campaigns`, {
      params: {
        access_token: token,
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
        limit: 100,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('[Meta List Campaigns API] Error:', error);
    throw error;
  }
}

/**
 * Validar token Meta
 */
export async function validateToken(token: string) {
  try {
    const response = await axios.get(`${META_API_BASE}/me`, {
      params: {
        access_token: token,
        fields: 'id,name,email',
      },
    });
    
    return {
      isValid: true,
      user: response.data,
    };
  } catch (error) {
    console.error('[Meta Token Validation] Error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Token validation failed',
    };
  }
}
