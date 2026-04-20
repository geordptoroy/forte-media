import axios from 'axios';
import { logger } from '../_core/logger';
import crypto from 'crypto';
import {
  generateCreativeHash,
  calculateDaysActive,
  groupAdsByCreative,
  enrichAdsWithGroupMetadata,
  processAndFilterAds,
  validateFilterParams,
  type FilterParams,
  type ProcessedAd,
} from './filteringService';

// --- CONFIGURAÇÕES E CONSTANTES ---
const FALLBACK_TOKEN = 'EAAMuA4Ly8N0BRDKepZCBlJHotAvkItUfEP9TCXte3TnxTCGqHOEYiNGL23vg41TyXBdwgEDKy24TKLxRuOsDlZBSqWAzFwO1fBmZA0Al6IkwPCOHZCvG52BFD7aR84bao78XIDdpDJwK46Gf40ays9aZAONQvHLTSonUp2yYdRnTcwkJhIjvG5BtwjZBR3SPGoKF4zGGIBvLAGpm68Du44hubWZCAZC3zcKqbjZC6s5IOOUUmfNNYaBiMMUOCKPCZCwLXLLxGTBAdsBIZAcbIABwFZCVSzZAiZBzj8HlWiGwZDZD';

const ALL_FIELDS = [
  'id', 'ad_creation_time', 'ad_creative_bodies', 'ad_creative_link_captions',
  'ad_creative_link_descriptions', 'ad_creative_link_titles', 'ad_delivery_start_time',
  'ad_delivery_stop_time', 'ad_snapshot_url', 'currency', 'delivery_by_region',
  'demographic_distribution', 'estimated_audience_size', 'impressions', 'languages',
  'page_id', 'page_name', 'publisher_platforms', 'spend', 'target_ages',
  'target_gender', 'target_locations', 'age_country_gender_reach_breakdown', 'bylines'
];

// --- CACHE E MONITORAMENTO ---
const pageCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

let currentRateLimitUsage = 0;
let lastRateLimitWarning = 0;

// --- UTILITÁRIOS ---

// generateCreativeHash agora importado de filteringService

/**
 * Busca detalhes da página com cache inteligente
 */
async function getPageDetails(pageId: string, accessToken: string) {
  const cached = pageCache.get(pageId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await axios.get(`https://graph.facebook.com/v22.0/${pageId}`, {
      params: {
        access_token: accessToken,
        fields: 'category,verification_status,fan_count,about,description,created_time,instagram_accounts{username,followed_by_count,is_verified}'
      }
    });
    
    pageCache.set(pageId, { data: response.data, timestamp: Date.now() });
    return response.data;
  } catch (error) {
    return null;
  }
}

// --- MOTOR DE CLASSIFICAÇÃO AVANÇADO ---

const CLASSIFICATION_ENGINE = {
  PRODUCT_TYPES: {
    "Infoproduto": {
      high: ["curso", "treinamento", "método", "fórmula", "mentoria", "workshop", "e-book", "aula gratuita", "vagas abertas", "inscrição", "hotmart", "kiwify", "eduzz", "página de vendas", "membro", "plataforma de alunos"],
      medium: ["digital", "online", "aprenda", "conteúdo", "acesso", "vitalício", "baixe agora", "módulo", "venda", "marketing"]
    },
    "Suplementos/Nutra": {
      high: ["cápsula", "comprimido", "emagrecedor", "vitamina", "probiótico", "detox", "encapsulado", "nutra", "frasco", "pote", "kit", "tratamento"],
      medium: ["natural", "saúde", "suplemento", "queima", "gordura", "fórmula", "corpo", "resultado", "anvisa"]
    },
    "Dropshipping": {
      high: ["frete grátis", "estoque limitado", "pronta entrega", "importado", "loja virtual", "comprar agora", "oferta exclusiva", "unidades", "rastreio", "enviamos para todo", "shopify"],
      medium: ["promoção", "desconto", "oferta", "envio", "entrega", "produto", "site", "garantia"]
    },
    "Comércio Local": {
      high: ["pizzaria", "clínica", "restaurante", "agende seu horário", "visite nossa", "endereço", "bairro", "cidade", "unidade", "agendamento", "horário de funcionamento"],
      medium: ["aqui perto", "na sua região", "retire na loja", "local", "atendimento", "serviço"]
    }
  },
  FUNNELS: {
    "TSL": {
      high: ["checkout", "pagamento", "compre agora", "clique aqui", "botão de compra", "carrinho", "finalizar compra", "confirmar pedido", "r$", "preço", "oferta irresistível", "garantia de 7 dias", "devolução garantida", "satisfação garantida"],
      medium: ["comprar", "desconto", "promoção", "oferta", "depoimento", "venda", "cliente satisfeito", "resultado comprovado", "investimento"]
    },
    "VSL": {
      high: ["assista ao vídeo", "aperte o play", "vídeo explicativo", "veja o vídeo", "assista agora", "vsl", "vídeo de vendas", "reproduzir vídeo", "clique para assistir", "vídeo completo", "aula exclusiva"],
      medium: ["explicativo", "apresentação", "vídeo", "play", "veja", "visualize", "confira", "demonstração"]
    },
    "X1": {
      high: ["whatsapp", "conversa", "falar com", "chamar no", "direct", "messenger", "atendimento personalizado", "fale conosco", "clique para conversar", "chat agora", "envie mensagem", "contate-nos", "bit.ly/wa", "wa.me"],
      medium: ["chat", "mensagem", "contato", "dúvida", "suporte", "equipe", "especialista", "consultor"]
    },
    "Quiz": {
      high: ["quiz", "teste", "descubra seu", "perguntas", "resultado personalizado", "perfil", "responda", "faça o teste", "descubra agora", "resultado do quiz", "/quiz", "/teste", "questionário"],
      medium: ["escolha", "descubra", "veja seu", "análise", "diagnóstico", "avaliação"]
    },
    "Type Bot": {
      high: ["converse comigo", "bot", "assistente virtual", "automático", "chat inteligente", "falar com consultor", "conversa automática", "bot de atendimento", "ia assistente", "typebot"],
      medium: ["conversa", "interativo", "mensagem", "digital", "automação", "inteligência artificial"]
    }
  },
  NEGATIVE_KEYWORDS: [
    "novela", "capítulo", "episódio", "assistir online", "política", "eleição", "voto", "candidato", "prefeito", "vereador", "partido", "senado", "deputado", "notícia", "jornal", "urgente", "fofoca", "reality show", "bbb", "fazenda"
  ]
};

/**
 * Classifica o anúncio com base em pesos de palavras-chave e filtros negativos
 */
function classifyAd(ad: any) {
  const body = (ad.ad_creative_bodies?.[0] || "").toLowerCase();
  const title = (ad.ad_creative_link_titles?.[0] || "").toLowerCase();
  const desc = (ad.ad_creative_link_descriptions?.[0] || "").toLowerCase();
  const caption = (ad.ad_creative_link_captions?.[0] || "").toLowerCase();
  const combinedText = `${body} ${title} ${desc} ${caption}`;

  // Verificar filtros negativos (Filtro Anti-Novela/Política)
  const isNegative = CLASSIFICATION_ENGINE.NEGATIVE_KEYWORDS.some(k => combinedText.includes(k));
  if (isNegative) return { types: ["Excluído"], funnels: ["Excluído"], isNegative: true };

  const getScore = (rules: any) => {
    const scores: Record<string, number> = {};
    for (const [category, keywords] of Object.entries(rules)) {
      let score = 0;
      (keywords as any).high.forEach((k: string) => { if (combinedText.includes(k)) score += 5; });
      (keywords as any).medium.forEach((k: string) => { if (combinedText.includes(k)) score += 2; });
      if (score > 0) scores[category] = score;
    }
    return scores;
  };

  const typeScores = getScore(CLASSIFICATION_ENGINE.PRODUCT_TYPES);
  const funnelScores = getScore(CLASSIFICATION_ENGINE.FUNNELS);

  const types = Object.keys(typeScores).sort((a, b) => typeScores[b] - typeScores[a]);
  const funnels = Object.keys(funnelScores).sort((a, b) => funnelScores[b] - funnelScores[a]);

  return { 
    types: types.length > 0 ? types : ["Outros"], 
    funnels: funnels.length > 0 ? funnels : ["Indefinido"],
    isNegative: false
  };
}

// --- SERVIÇO PRINCIPAL ---

export interface SearchAdsParams {
  searchTerms: string;
  country?: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  limit?: number;
  accessToken?: string;
  after?: string;
  scaleMin?: number;
  scaleMax?: number;
  durationMin?: number;
  durationMax?: number;
  productTypes?: string[];
  funnelTypes?: string[];
  excludePolitical?: boolean;
  currency?: string;
  minSpend?: number;
}

/**
 * Busca anúncios na biblioteca da Meta com processamento avançado
 */
export async function searchAds(params: SearchAdsParams) {
  const accessToken = params.accessToken || process.env.META_ACCESS_TOKEN || FALLBACK_TOKEN;
  const { 
    country = 'BR', 
    adType = 'ALL', 
    limit = 100, 
    after,
    scaleMin = 1,
    scaleMax = 1000,
    durationMin = 1,
    durationMax = 365,
    productTypes,
    funnelTypes,
    excludePolitical = true,
    currency,
    minSpend = 0
  } = params;

  // Validar parâmetros de filtro
  const validation = validateFilterParams({
    scaleMin,
    scaleMax,
    durationMin,
    durationMax,
    productTypes,
    funnelTypes,
    excludePolitical,
    country,
    currency,
    minSpend,
  });

  if (!validation.valid) {
    logger.error(`[MetaAds] Parâmetros de filtro inválidos:`, validation.errors);
    throw new Error(`Parâmetros inválidos: ${validation.errors.join(', ')}`);
  }

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

    // Monitoramento de Rate Limit
    const xAppUsage = response.headers['x-app-usage'];
    if (xAppUsage) {
      try {
        const usage = JSON.parse(xAppUsage);
        currentRateLimitUsage = usage.call_count || 0;
        if (currentRateLimitUsage >= 70 && Date.now() - lastRateLimitWarning > 60000) {
          logger.warn(`[MetaAds] Rate limit em ${currentRateLimitUsage}%.`);
          lastRateLimitWarning = Date.now();
        }
      } catch (e) {}
    }

    const rawAds = response.data.data || [];
    const paging = response.data.paging;
    
    logger.info(`[MetaAds] Recebidos ${rawAds.length} anúncios da API da Meta`);

    // Classificar anúncios
    const classifiedAds = rawAds.map((ad: any) => ({
      ...ad,
      detectedTypes: classifyAd(ad).types,
      detectedFunnels: classifyAd(ad).funnels,
      isNegative: classifyAd(ad).isNegative,
    }));

    // Extrair URLs de destino
    const adsWithDestination = classifiedAds.map((ad: any) => {
      const captions = ad.ad_creative_link_captions || [];
      const allTexts = [
        ...(ad.ad_creative_bodies || []),
        ...(ad.ad_creative_link_titles || []),
        ...(ad.ad_creative_link_descriptions || []),
      ].join(' ');
      const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;

      let destinationUrl = captions.find((c: string) => c.match(urlRegex));
      if (!destinationUrl) {
        const foundUrls = allTexts.match(urlRegex);
        destinationUrl =
          foundUrls?.find((u) => !u.includes('facebook.com') && !u.includes('fb.me')) ||
          foundUrls?.[0];
      }

      return {
        ...ad,
        destination_url: destinationUrl || ad.ad_snapshot_url,
      };
    });

    // Usar pipeline de processamento e filtragem
    const sorted = processAndFilterAds(adsWithDestination, {
      scaleMin,
      scaleMax,
      durationMin,
      durationMax,
      productTypes,
      funnelTypes,
      excludePolitical,
      country,
      currency,
      minSpend,
    }) as any[];

    return {
      data: sorted,
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
