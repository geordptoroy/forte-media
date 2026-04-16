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

// Cache simples para dados de página
const pageCache = new Map<string, any>();

function generateCreativeHash(ad: any) {
  const body = (ad.ad_creative_bodies?.[0] || "").toLowerCase().trim();
  const title = (ad.ad_creative_link_titles?.[0] || "").toLowerCase().trim();
  const caption = (ad.ad_creative_link_captions?.[0] || "").toLowerCase().trim();
  
  // Normalizar para evitar falsos negativos
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

const NICHE_CONFIG: Record<string, { keywords: string[], searchTerms: string[] }> = {
  "Relacionamento": {
    keywords: ["namoro", "casamento", "conquista", "relacionamento", "ex", "seduzir", "reconquista", "parceiro", "esposa", "marido"],
    searchTerms: ["conquista", "relacionamento", "salvar casamento"]
  },
  "Espiritualidade": {
    keywords: ["deus", "fé", "oração", "espiritual", "alma", "meditação", "universo", "astrologia", "signo", "manifestação", "lei da atração"],
    searchTerms: ["lei da atração", "meditação guiada", "oração"]
  },
  "Renda Extra": {
    keywords: ["dinheiro", "ganhar", "renda", "trabalhar em casa", "lucro", "vendas", "afiliado", "dropshipping", "marketing digital", "comissão", "liberdade financeira"],
    searchTerms: ["renda extra", "trabalhar em casa", "ganhar dinheiro online"]
  },
  "Emagrecimento": {
    keywords: ["perder peso", "emagrecer", "dieta", "jejum", "queimar gordura", "detox", "fitness", "barriga", "peso", "calorias", "receitas fit"],
    searchTerms: ["emagrecer rápido", "dieta detox", "queimar gordura"]
  },
  "Marketing Digital": {
    keywords: ["tráfego", "lançamento", "copywriting", "vendas online", "anúncios", "leads", "conversão", "funil", "pixel", "escala"],
    searchTerms: ["tráfego pago", "vendas online", "marketing digital"]
  }
};

const PRODUCT_TYPE_CONFIG: Record<string, { keywords: string[], searchTerms: string[] }> = {
  "Infoproduto": {
    keywords: ["curso", "e-book", "mentoria", "aula", "treinamento", "digital", "pdf", "acesso imediato", "vagas", "inscrição"],
    searchTerms: ["curso online", "ebook", "mentoria"]
  },
  "Nutra": {
    keywords: ["suplemento", "vitamina", "natural", "cápsula", "saúde", "fórmula", "extrato", "gotas", "comprimido"],
    searchTerms: ["suplemento natural", "vitamina", "gotas para emagrecer"]
  },
  "Encapsulado": {
    keywords: ["pote", "frasco", "cápsulas", "tratamento", "entrega", "frete", "estoque", "unidades", "frascos"],
    searchTerms: ["encapsulado", "frasco", "tratamento natural"]
  }
};

function classifyAd(ad: any) {
  const body = (ad.ad_creative_bodies?.[0] || "").toLowerCase();
  const title = (ad.ad_creative_link_titles?.[0] || "").toLowerCase();
  const combinedText = `${body} ${title}`;

  let detectedNiche = "Outros";
  let detectedType = "Infoproduto";

  for (const [n, config] of Object.entries(NICHE_CONFIG)) {
    if (config.keywords.some(k => combinedText.includes(k))) {
      detectedNiche = n;
      break;
    }
  }

  for (const [t, config] of Object.entries(PRODUCT_TYPE_CONFIG)) {
    if (config.keywords.some(k => combinedText.includes(k))) {
      detectedType = t;
      break;
    }
  }

  let ctaText = "Saiba Mais";
  if (combinedText.includes("comprar") || combinedText.includes("oferta") || combinedText.includes("desconto")) ctaText = "Comprar Agora";
  if (combinedText.includes("whatsapp") || combinedText.includes("contato") || combinedText.includes("mensagem")) ctaText = "Enviar Mensagem";
  if (combinedText.includes("baixar") || combinedText.includes("download") || combinedText.includes("ebook")) ctaText = "Baixar";
  if (combinedText.includes("inscreva") || combinedText.includes("vagas")) ctaText = "Cadastre-se";

  return { niche: detectedNiche, productType: detectedType, ctaText };
}

export interface SearchAdsParams {
  searchTerms: string;
  country?: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit?: number;
  accessToken?: string;
  niche?: string;
  productType?: string;
  activeSince?: string;
  after?: string;
}

export async function searchAds(params: SearchAdsParams) {
  const accessToken = params.accessToken || process.env.META_ACCESS_TOKEN || FALLBACK_TOKEN;
  const { country = 'BR', adType = 'ALL', limit = 100, activeSince, after } = params;

  let finalSearchTerms = params.searchTerms;
  if (!finalSearchTerms && params.niche && NICHE_CONFIG[params.niche]) {
    finalSearchTerms = NICHE_CONFIG[params.niche].searchTerms[0];
  }
  if (params.productType && PRODUCT_TYPE_CONFIG[params.productType]) {
    finalSearchTerms = `${finalSearchTerms} ${PRODUCT_TYPE_CONFIG[params.productType].searchTerms[0]}`.trim();
  }

  const url = `https://graph.facebook.com/v22.0/ads_archive`;
  
  let start_date_min = undefined;
  if (activeSince && activeSince !== 'anytime') {
    const now = new Date();
    const days = parseInt(activeSince);
    if (!isNaN(days)) {
      now.setDate(now.getDate() - days);
      start_date_min = now.toISOString().split('T')[0];
    }
  }

  try {
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        search_terms: finalSearchTerms || "marketing",
        ad_type: adType,
        ad_reached_countries: `['${country}']`,
        fields: ALL_FIELDS.join(','),
        limit: limit,
        ad_active_status: 'ACTIVE',
        ...(start_date_min && { ad_delivery_start_time_min: start_date_min }),
        ...(after && { after })
      }
    });

    const rawAds = response.data.data || [];
    const paging = response.data.paging;
    
    // 1. Agrupamento por Criativo (Collation)
    const creativeGroups = new Map<string, number>();
    rawAds.forEach((ad: any) => {
      const hash = generateCreativeHash(ad);
      creativeGroups.set(hash, (creativeGroups.get(hash) || 0) + 1);
    });

    // 2. Processamento e Enriquecimento
    const processed = await Promise.all(rawAds.map(async (ad: any) => {
      const classification = classifyAd(ad);
      const hash = generateCreativeHash(ad);
      
      // Obter detalhes da página (com cache)
      const pageDetails = await getPageDetails(ad.page_id, accessToken);

      return {
        ...ad,
        detectedNiche: classification.niche,
        detectedProductType: classification.productType,
        ctaText: classification.ctaText,
        frequency: creativeGroups.get(hash) || 1,
        creativeHash: hash,
        pageDetails: pageDetails
      };
    }));

    let filtered = processed;
    if (params.niche && params.niche !== "Todos") {
      filtered = filtered.filter((ad: any) => ad.detectedNiche === params.niche);
    }
    if (params.productType && params.productType !== "Todos") {
      filtered = filtered.filter((ad: any) => ad.detectedProductType === params.productType);
    }

    return {
      data: filtered,
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
