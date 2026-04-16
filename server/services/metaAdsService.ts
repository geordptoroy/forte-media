import axios from 'axios';
import { logger } from '../_core/logger';
import crypto from 'crypto';

const FALLBACK_TOKEN = 'EAAMuA4Ly8N0BRDKepZCBlJHotAvkItUfEP9TCXte3TnxTCGqHOEYiNGL23vg41TyXBdwgEDKy24TKLxRuOsDlZBSqWAzFwO1fBmZA0Al6IkwPCOHZCvG52BFD7aR84bao78XIDdpDJwK46Gf40ays9aZAONQvHLTSonUp2yYdRnTcwkJhIjvG5BtwjZBR3SPGoKF4zGGIBvLAGpm68Du44hubWZCAZC3zcKqbjZC6s5IOOUUmfNNYaBiMMUOCKPCZCwLXLLxGTBAdsBIZAcbIABwFZCVSzZAiZBzj8HlWiGwZDZD';

const ALL_FIELDS = [
  'id', 'ad_creation_time', 'ad_creative_bodies', 'ad_creative_link_captions',
  'ad_creative_link_descriptions', 'ad_creative_link_titles', 'ad_delivery_start_time',
  'ad_delivery_stop_time', 'ad_snapshot_url', 'currency', 'delivery_by_region',
  'demographic_distribution', 'estimated_audience_size', 'impressions', 'languages',
  'page_id', 'page_name', 'publisher_platforms', 'spend', 'target_ages',
  'target_gender', 'target_locations', 'age_country_gender_reach_breakdown', 'bylines'
];

const pageCache = new Map<string, any>();

function generateCreativeHash(ad: any) {
  const body = (ad.ad_creative_bodies?.[0] || "").toLowerCase().trim();
  const title = (ad.ad_creative_link_titles?.[0] || "").toLowerCase().trim();
  const caption = (ad.ad_creative_link_captions?.[0] || "").toLowerCase().trim();
  const normalized = `${body}|${title}|${caption}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

async function getPageDetails(pageId: string, accessToken: string) {
  if (pageCache.has(pageId)) return pageCache.get(pageId);
  try {
    const response = await axios.get(`https://graph.facebook.com/v22.0/${pageId}`, {
      params: {
        access_token: accessToken,
        fields: 'category,verification_status,fan_count,about,description,created_time,instagram_accounts{username,followed_by_count,is_verified}'
      }
    });
    pageCache.set(pageId, response.data);
    return response.data;
  } catch (error) {
    return null;
  }
}

// Configuração de Classificação de Tipo de Produto
const PRODUCT_TYPE_RULES = {
  "Infoproduto": ["curso", "treinamento", "método", "fórmula", "acesso vitalício", "baixe agora", "aprenda", "workshop", "e-book", "mentoria", "aula"],
  "Suplementos/Nutra": ["cápsula", "comprimido", "fórmula natural", "emagrecedor", "vitamina", "probiótico", "detox", "encapsulado", "nutra", "pote", "frasco"],
  "Dropshipping": ["envio direto da fábrica", "estoque limitado", "frete grátis", "produto importado", "dropshipping", "pronta entrega", "oferta exclusiva", "loja"],
  "Comércio Local": ["pizzaria", "clínica", "restaurante", "aqui perto", "na sua região", "retire na loja", "endereço", "bairro", "cidade", "agende seu horário"],
  "Moda": ["roupa", "vestido", "calçado", "sapato", "acessório", "look", "moda", "coleção"],
  "Eletrônicos": ["smartphone", "celular", "fone", "gadget", "tecnologia", "computador", "notebook"],
  "Serviços": ["consultoria", "seguro", "plano de saúde", "advogado", "contabilidade", "serviço"]
};

// Configuração de Classificação de Estrutura de Funil
const FUNNEL_STRUCTURE_RULES = {
  "TSL": ["r$", "oferta", "desconto", "garantia", "depoimento", "preço", "9,90", "47", "97"],
  "VSL": ["assista ao vídeo", "aperte o play", "vídeo explicativo", "veja o vídeo", "assista agora"],
  "X1": ["webinar", "apresentação ao vivo", "evento online", "vagas limitadas", "participe", "aula ao vivo"],
  "Landing Page": ["baixe grátis", "cadastre-se", "receba o material", "e-book gratuito", "lista de espera"],
  "Quiz": ["quiz", "teste", "descubra", "perguntas", "resultado personalizado", "perfil"],
  "Type Bot": ["converse comigo", "chat", "bot", "whatsapp", "messenger", "envie uma mensagem", "falar com consultor"]
};

function classifyAd(ad: any) {
  const body = (ad.ad_creative_bodies?.[0] || "").toLowerCase();
  const title = (ad.ad_creative_link_titles?.[0] || "").toLowerCase();
  const desc = (ad.ad_creative_link_descriptions?.[0] || "").toLowerCase();
  const combinedText = `${body} ${title} ${desc}`;

  const types: string[] = [];
  const funnels: string[] = [];

  for (const [type, keywords] of Object.entries(PRODUCT_TYPE_RULES)) {
    if (keywords.some(k => combinedText.includes(k))) {
      types.push(type);
    }
  }

  for (const [funnel, keywords] of Object.entries(FUNNEL_STRUCTURE_RULES)) {
    if (keywords.some(k => combinedText.includes(k))) {
      funnels.push(funnel);
    }
  }

  if (types.length === 0) types.push("Outros");
  if (funnels.length === 0) funnels.push("Indefinido");

  return { types, funnels };
}

export interface SearchAdsParams {
  searchTerms: string;
  country?: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit?: number;
  accessToken?: string;
  after?: string;
}

export async function searchAds(params: SearchAdsParams) {
  const accessToken = params.accessToken || process.env.META_ACCESS_TOKEN || FALLBACK_TOKEN;
  const { country = 'BR', adType = 'ALL', limit = 100, after } = params;

  const url = `https://graph.facebook.com/v22.0/ads_archive`;
  
  try {
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        search_terms: params.searchTerms || "marketing",
        ad_type: adType,
        ad_reached_countries: `['${country}']`,
        fields: ALL_FIELDS.join(','),
        limit: limit,
        ad_active_status: 'ACTIVE',
        ...(after && { after })
      }
    });

    const rawAds = response.data.data || [];
    const paging = response.data.paging;
    
    const creativeGroups = new Map<string, number>();
    rawAds.forEach((ad: any) => {
      const hash = generateCreativeHash(ad);
      creativeGroups.set(hash, (creativeGroups.get(hash) || 0) + 1);
    });

    const processed = await Promise.all(rawAds.map(async (ad: any) => {
      const classification = classifyAd(ad);
      const hash = generateCreativeHash(ad);
      const pageDetails = await getPageDetails(ad.page_id, accessToken);

      return {
        ...ad,
        detectedTypes: classification.types,
        detectedFunnels: classification.funnels,
        frequency: creativeGroups.get(hash) || 1,
        creativeHash: hash,
        pageDetails: pageDetails
      };
    }));

    return {
      data: processed,
      paging: {
        next_cursor: paging?.cursors?.after
      }
    };
  } catch (error: any) {
    const errorData = error.response?.data || { error: { message: error.message } };
    logger.error(`[MetaAds] Erro na API da Meta:`, errorData);
    throw new Error(errorData.error?.message || 'Falha ao buscar anúncios na Meta');
  }
}
