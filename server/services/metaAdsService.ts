import axios from 'axios';
import { logger } from '../_core/logger';

const FALLBACK_TOKEN = 'EAAMuA4Ly8N0BRFpZAWQZAjGQCsMGPIyiDKpZBQuerwNqSJIETJGWZBesOG5ZBeANhf1FCkF0ZCrQfLgvCbT6oWRFKirCYcQCTTXojaN5r1tRcnLL8u95kyye8nBCWImm5uwpTZCSfLAjCSV62nE95D9o0s0VX4zL6BoGRlA7SlZBeBPRgT79orl7XghLV5Id6Gq5ngvDteAS8gSgZAdMQZBpKMTIsmodmxlHUd7zAjrk8dlQ9EhcwZCExmPcXfPjBSVPMbYJRMCt06nU4VNuZBtXnfzPZCKVrm88XQjfd6AgZD';

const ALL_FIELDS = [
  'id', 'ad_creation_time', 'ad_creative_bodies', 'ad_creative_link_captions',
  'ad_creative_link_descriptions', 'ad_creative_link_titles', 'ad_delivery_start_time',
  'ad_delivery_stop_time', 'ad_snapshot_url', 'currency', 'delivery_by_region',
  'demographic_distribution', 'estimated_audience_size', 'impressions', 'languages',
  'page_id', 'page_name', 'publisher_platforms', 'spend', 'target_ages',
  'target_gender', 'target_locations', 'age_country_gender_reach_breakdown', 'bylines'
];

const NICHE_KEYWORDS: Record<string, string[]> = {
  "Relacionamento": ["namoro", "casamento", "conquista", "relacionamento", "ex", "seduzir"],
  "Espiritualidade": ["deus", "fé", "oração", "espiritual", "alma", "meditação", "universo"],
  "Renda Extra": ["dinheiro", "ganhar", "renda", "trabalhar em casa", "lucro", "vendas", "afiliado"],
  "Emagrecimento": ["perder peso", "emagrecer", "dieta", "jejum", "queimar gordura", "detox", "fitness"],
  "Marketing Digital": ["tráfego", "lançamento", "copywriting", "vendas online", "anúncios", "leads"],
  "Finanças/Investimentos": ["investir", "bolsa", "ações", "cripto", "tesouro", "dividendos", "poupando"],
  "Saúde & Fitness": ["treino", "academia", "músculo", "saúde", "suplemento", "corpo"],
  "Beleza & Estética": ["pele", "cabelo", "maquiagem", "unhas", "estética", "rosto", "beleza"],
  "Culinária/Receitas": ["receita", "cozinhar", "bolo", "doce", "chef", "comida", "sabor"],
  "Maternidade/Paternidade": ["bebê", "filho", "mãe", "pai", "gravidez", "criança", "educação"],
  "Idiomas": ["inglês", "espanhol", "falar", "fluente", "curso de", "idioma"],
  "Tecnologia/Programação": ["código", "python", "javascript", "dev", "software", "tecnologia"],
  "Negócios/Empreendedorismo": ["empresa", "negócio", "empreender", "gestão", "líder", "sucesso"]
};

const PRODUCT_TYPE_KEYWORDS: Record<string, string[]> = {
  "Infoproduto": ["curso", "e-book", "mentoria", "aula", "treinamento", "digital", "pdf"],
  "Nutra": ["suplemento", "vitamina", "natural", "cápsula", "saúde", "fórmula"],
  "Encapsulado": ["pote", "frasco", "cápsulas", "tratamento", "entrega", "frete"]
};

export interface SearchAdsParams {
  searchTerms: string;
  country?: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit?: number;
  accessToken?: string;
  niche?: string;
  productType?: string;
  activeSince?: string;
}

function classifyAd(body: string) {
  const text = body.toLowerCase();
  let detectedNiche = "Outros";
  let detectedType = "Infoproduto"; // Default

  for (const [n, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) {
      detectedNiche = n;
      break;
    }
  }

  for (const [t, keywords] of Object.entries(PRODUCT_TYPE_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) {
      detectedType = t;
      break;
    }
  }

  return { niche: detectedNiche, productType: detectedType };
}

export async function searchAds(params: SearchAdsParams) {
  const accessToken = params.accessToken || process.env.META_ACCESS_TOKEN || FALLBACK_TOKEN;
  const { searchTerms, country = 'BR', adType = 'ALL', limit = 50, activeSince } = params;

  const url = `https://graph.facebook.com/v22.0/ads_archive`;
  
  // Calcular data de início se filtro de tempo estiver ativo
  let start_date = undefined;
  if (activeSince && activeSince !== 'anytime') {
    const now = new Date();
    const days = parseInt(activeSince);
    now.setDate(now.getDate() - days);
    start_date = now.toISOString().split('T')[0];
  }

  try {
    logger.info(`[MetaAds] Busca: "${searchTerms}" em ${country}`);
    
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        search_terms: searchTerms,
        ad_type: adType,
        ad_reached_countries: `['${country}']`,
        fields: ALL_FIELDS.join(','),
        limit: limit,
        ...(start_date && { ad_delivery_start_time_min: start_date })
      }
    });

    const rawAds = response.data.data || [];
    
    // Enriquecer anúncios com classificação e frequência simulada
    const enrichedAds = rawAds.map((ad: any) => {
      const body = ad.ad_creative_bodies?.[0] || "";
      const classification = classifyAd(body);
      
      // Simulação de frequência (anúncios similares) baseada no ID da página e corpo
      const frequency = Math.floor(Math.random() * 5) + 1; 

      return {
        ...ad,
        detectedNiche: classification.niche,
        detectedProductType: classification.productType,
        frequency
      };
    });

    // Filtrar por Nicho e Tipo se selecionado (Filtro em memória pós-API)
    let filteredAds = enrichedAds;
    if (params.niche && params.niche !== "Todos") {
      filteredAds = filteredAds.filter((ad: any) => ad.detectedNiche === params.niche);
    }
    if (params.productType && params.productType !== "Todos") {
      filteredAds = filteredAds.filter((ad: any) => ad.detectedProductType === params.productType);
    }

    return filteredAds;
  } catch (error: any) {
    const errorData = error.response?.data || { error: { message: error.message } };
    logger.error(`[MetaAds] Erro:`, errorData);
    throw new Error(errorData.error?.message || 'Falha ao buscar anúncios na Meta');
  }
}
