import axios from 'axios';
import { config } from '../config';

const META_API_BASE = 'https://graph.facebook.com/v18.0';

export async function searchAds(params: {
  search_terms?: string;
  ad_reached_countries?: string[];
  ad_type?: string;
  limit?: number;
  after?: string;
}) {
  const response = await axios.get(`${META_API_BASE}/ads_archive`, {
    params: {
      access_token: config.meta.apiKey,
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
      ...params,
    },
  });
  return response.data;
}

export async function getAdDetails(adId: string) {
  const response = await axios.get(`${META_API_BASE}/${adId}`, {
    params: {
      access_token: config.meta.apiKey,
      fields: 'id,page_id,page_name,ad_snapshot_url,spend,impressions',
    },
  });
  return response.data;
}
