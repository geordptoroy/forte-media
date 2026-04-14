import axios from 'axios';
import { logger } from '../_core/logger';

// Priorizar o Access Token do .env, caso contrário usar o fallback (que deve ser atualizado no .env)
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAMuA4Ly8N0BRF0bnGutJMjvKNmcybx3Cr7ZBhHEnUMEFdfJFkGtt4ctQAoqvV8YTVe74TrNSPtMF0KXZCOctSfhQgHKW8YM7O0ZCZBI1aCBXr2s8uFpUZClv2cAIGXx0MPwPntZA3pfJ54ZBACDnaDVevkZBhQayVlZBulZB4X0cI6AeqdjPDA17G3bZACFptY2HQUVb8R6BZCdNGi15I9kraZBeq0LjX0SEvms6vZAWjq4aEIrThc3DyZBsmV8gyh0q3DNKAvqYPzUTPvkANf7NnG15q0GDZATIW9d4rOllhAZD';

const ALL_FIELDS = [
  'id',
  'ad_creation_time',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'ad_snapshot_url',
  'currency',
  'delivery_by_region',
  'demographic_distribution',
  'estimated_audience_size',
  'impressions',
  'languages',
  'page_id',
  'page_name',
  'publisher_platforms',
  'spend',
  'target_ages',
  'target_gender',
  'target_locations',
  'age_country_gender_reach_breakdown',
  'bylines'
];

export interface SearchAdsParams {
  searchTerms: string;
  country?: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit?: number;
  accessToken?: string;
}

export async function searchAds(params: SearchAdsParams) {
  const { 
    searchTerms, 
    country = 'BR', 
    adType = 'ALL', 
    limit = 25, 
    accessToken = META_ACCESS_TOKEN 
  } = params;

  const url = `https://graph.facebook.com/v22.0/ads_archive`;

  try {
    logger.info(`[MetaAds] Buscando anúncios: "${searchTerms}" em ${country}`);
    
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        search_terms: searchTerms,
        ad_type: adType,
        ad_reached_countries: `['${country}']`,
        fields: ALL_FIELDS.join(','),
        limit: limit
      }
    });

    return response.data.data || [];
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    logger.error(`[MetaAds] Erro na busca:`, errorData);
    throw new Error(errorData.error?.message || 'Falha ao buscar anúncios na Meta');
  }
}
