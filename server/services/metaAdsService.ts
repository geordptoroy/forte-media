import axios from 'axios';
import { logger } from '../_core/logger';

// Token temporário fornecido pelo usuário para teste imediato
const FALLBACK_TOKEN = 'EAAMuA4Ly8N0BRFpZAWQZAjGQCsMGPIyiDKpZBQuerwNqSJIETJGWZBesOG5ZBeANhf1FCkF0ZCrQfLgvCbT6oWRFKirCYcQCTTXojaN5r1tRcnLL8u95kyye8nBCWImm5uwpTZCSfLAjCSV62nE95D9o0s0VX4zL6BoGRlA7SlZBeBPRgT79orl7XghLV5Id6Gq5ngvDteAS8gSgZAdMQZBpKMTIsmodmxlHUd7zAjrk8dlQ9EhcwZCExmPcXfPjBSVPMbYJRMCt06nU4VNuZBtXnfzPZCKVrm88XQjfd6AgZD';

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
  // LOG AGRESSIVO PARA DEPURAÇÃO
  console.log('--- DEBUG META ADS SEARCH ---');
  console.log('Parâmetros recebidos:', JSON.stringify(params));
  console.log('process.env.META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? `${process.env.META_ACCESS_TOKEN.substring(0, 15)}...` : 'NÃO DEFINIDO');
  
  // Prioridade: 1. Parâmetro da função, 2. Variável de ambiente, 3. Token de fallback
  const accessToken = params.accessToken || process.env.META_ACCESS_TOKEN || FALLBACK_TOKEN;
  
  console.log('Token final selecionado:', `${accessToken.substring(0, 15)}...`);

  const { 
    searchTerms, 
    country = 'BR', 
    adType = 'ALL', 
    limit = 50
  } = params;

  const url = `https://graph.facebook.com/v22.0/ads_archive`;

  try {
    logger.info(`[MetaAds] Iniciando busca: "${searchTerms}" em ${country}`);
    
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

    logger.info(`[MetaAds] Busca concluída: ${response.data.data?.length || 0} resultados encontrados.`);
    return response.data.data || [];
  } catch (error: any) {
    const errorData = error.response?.data || { error: { message: error.message } };
    console.error('[MetaAds] ERRO DETALHADO DA API:', JSON.stringify(errorData, null, 2));
    
    // Se o erro for de token, lançar uma mensagem mais clara
    if (errorData.error?.code === 190 || errorData.error?.message?.includes('access token')) {
      throw new Error(`Token da Meta Inválido ou Expirado: ${errorData.error.message}`);
    }
    
    throw new Error(errorData.error?.message || 'Falha ao buscar anúncios na Meta');
  }
}
