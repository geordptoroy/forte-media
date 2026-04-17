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

/**
 * Motor de Classificação Inteligente (Baseado em Pesos)
 * Em vez de um simples "includes", usamos um sistema de pontuação para evitar falsos positivos
 * e garantir que o anúncio seja classificado no tipo mais provável.
 */
const CLASSIFICATION_ENGINE = {
  PRODUCT_TYPES: {
    "Infoproduto": {
      high: ["curso", "treinamento", "método", "fórmula", "mentoria", "workshop", "e-book", "aula gratuita", "vagas abertas", "inscrição"],
      medium: ["digital", "online", "aprenda", "conteúdo", "acesso", "vitalício", "baixe agora", "módulo"]
    },
    "Suplementos/Nutra": {
      high: ["cápsula", "comprimido", "emagrecedor", "vitamina", "probiótico", "detox", "encapsulado", "nutra", "frasco", "pote"],
      medium: ["natural", "saúde", "suplemento", "queima", "gordura", "fórmula", "corpo", "resultado"]
    },
    "Dropshipping": {
      high: ["frete grátis", "estoque limitado", "pronta entrega", "importado", "loja virtual", "comprar agora", "oferta exclusiva", "unidades"],
      medium: ["promoção", "desconto", "oferta", "envio", "entrega", "produto", "site", "garantia"]
    },
    "Comércio Local": {
      high: ["pizzaria", "clínica", "restaurante", "agende seu horário", "visite nossa", "endereço", "bairro", "cidade", "unidade"],
      medium: ["aqui perto", "na sua região", "retire na loja", "local", "atendimento", "serviço"]
    },
    "Moda": {
      high: ["roupa", "vestido", "calçado", "sapato", "look", "coleção", "vestuário", "peças", "estilo"],
      medium: ["moda", "acessório", "feminino", "masculino", "tamanho", "cor", "tecido"]
    },
    "Eletrônicos": {
      high: ["smartphone", "celular", "gadget", "iphone", "android", "notebook", "computador", "fone de ouvido"],
      medium: ["tecnologia", "tech", "eletrônico", "dispositivo", "carregador", "bluetooth"]
    },
    "Serviços": {
      high: ["consultoria", "seguro", "plano de saúde", "advogado", "contabilidade", "atendimento profissional", "suporte"],
      medium: ["serviço", "solução", "especialista", "ajuda", "empresa", "negócio"]
    }
  },
  FUNNELS: {
    "TSL": {
      high: ["checkout", "pagamento", "r$", "preço", "9,90", "47", "97", "oferta irresistível", "garantia de 7 dias"],
      medium: ["comprar", "desconto", "promoção", "oferta", "depoimento", "venda"]
    },
    "VSL": {
      high: ["assista ao vídeo", "aperte o play", "vídeo explicativo", "veja o vídeo", "assista agora", "vsl", "vídeo de vendas"],
      medium: ["explicativo", "apresentação", "vídeo", "play", "veja"]
    },
    "X1": {
      high: ["whatsapp", "conversa", "falar com", "chamar no", "direct", "messenger", "atendimento personalizado", "fale conosco"],
      medium: ["chat", "mensagem", "contato", "dúvida", "suporte", "equipe"]
    },
    "Landing Page": {
      high: ["baixe grátis", "cadastre-se", "receba o material", "e-book gratuito", "lista de espera", "saiba mais", "página oficial"],
      medium: ["site", "link", "acesso", "informação", "detalhes"]
    },
    "Quiz": {
      high: ["quiz", "teste", "descubra seu", "perguntas", "resultado personalizado", "perfil", "responda"],
      medium: ["escolha", "descubra", "veja seu", "análise"]
    },
    "Type Bot": {
      high: ["converse comigo", "bot", "assistente virtual", "automático", "chat inteligente", "falar com consultor"],
      medium: ["conversa", "interativo", "mensagem", "digital"]
    }
  }
};

function classifyAd(ad: any) {
  const body = (ad.ad_creative_bodies?.[0] || "").toLowerCase();
  const title = (ad.ad_creative_link_titles?.[0] || "").toLowerCase();
  const desc = (ad.ad_creative_link_descriptions?.[0] || "").toLowerCase();
  const combinedText = `${body} ${title} ${desc}`;

  const getScore = (rules: any) => {
    const scores: Record<string, number> = {};
    for (const [category, keywords] of Object.entries(rules)) {
      let score = 0;
      // @ts-ignore
      keywords.high.forEach(k => { if (combinedText.includes(k)) score += 3; });
      // @ts-ignore
      keywords.medium.forEach(k => { if (combinedText.includes(k)) score += 1; });
      if (score > 0) scores[category] = score;
    }
    return scores;
  };

  const typeScores = getScore(CLASSIFICATION_ENGINE.PRODUCT_TYPES);
  const funnelScores = getScore(CLASSIFICATION_ENGINE.FUNNELS);

  // Pegamos as categorias com maior pontuação, ou "Outros" se nada for detectado
  const types = Object.keys(typeScores).sort((a, b) => typeScores[b] - typeScores[a]);
  const funnels = Object.keys(funnelScores).sort((a, b) => funnelScores[b] - funnelScores[a]);

  return { 
    types: types.length > 0 ? types : ["Outros"], 
    funnels: funnels.length > 0 ? funnels : ["Indefinido"] 
  };
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
        search_terms: params.searchTerms || "",
        ad_type: adType,
        ad_reached_countries: country === "ALL" ? undefined : `['${country}']`,
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

      // Extração de URL aprimorada (Regex mais robusto)
      const creativeTexts = [
        ...(ad.ad_creative_bodies || []),
        ...(ad.ad_creative_link_captions || []),
        ...(ad.ad_creative_link_descriptions || []),
        ...(ad.ad_creative_link_titles || [])
      ].join(" ");
      
      const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
      const foundUrls = creativeTexts.match(urlRegex);
      
      // Filtrar URLs que não sejam da própria Meta/Facebook se possível
      const destinationUrl = foundUrls?.find(u => !u.includes('facebook.com') && !u.includes('fb.me')) || 
                           foundUrls?.[0] || 
                           ad.ad_snapshot_url;

      return {
        ...ad,
        detectedTypes: classification.types,
        detectedFunnels: classification.funnels,
        frequency: creativeGroups.get(hash) || 1,
        creativeHash: hash,
        pageDetails: pageDetails,
        destination_url: destinationUrl
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
