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
  },
  "Finanças/Investimentos": {
    keywords: ["investir", "bolsa", "ações", "cripto", "tesouro", "dividendos", "poupando", "bitcoin", "mercado financeiro", "trade"],
    searchTerms: ["investimentos", "bolsa de valores", "criptomoedas"]
  },
  "Saúde & Fitness": {
    keywords: ["treino", "academia", "músculo", "saúde", "suplemento", "corpo", "hipertrofia", "exercício", "performance"],
    searchTerms: ["treino em casa", "suplementos", "hipertrofia"]
  },
  "Beleza & Estética": {
    keywords: ["pele", "cabelo", "maquiagem", "unhas", "estética", "rosto", "beleza", "rugas", "rejuvenescimento", "colágeno"],
    searchTerms: ["cuidados com a pele", "maquiagem profissional", "rejuvenescimento"]
  },
  "Culinária/Receitas": {
    keywords: ["receita", "cozinhar", "bolo", "doce", "chef", "comida", "sabor", "gastronomia", "cozinha"],
    searchTerms: ["receitas fáceis", "confeitaria", "cozinha gourmet"]
  },
  "Maternidade/Paternidade": {
    keywords: ["bebê", "filho", "mãe", "pai", "gravidez", "criança", "educação", "fralda", "amamentação"],
    searchTerms: ["maternidade", "cuidados com bebê", "educação infantil"]
  },
  "Idiomas": {
    keywords: ["inglês", "espanhol", "falar", "fluente", "curso de", "idioma", "aprender", "vocabulário"],
    searchTerms: ["curso de inglês", "falar espanhol", "aprender idiomas"]
  },
  "Tecnologia/Programação": {
    keywords: ["código", "python", "javascript", "dev", "software", "tecnologia", "programador", "ti", "web"],
    searchTerms: ["curso de programação", "aprender python", "desenvolvimento web"]
  },
  "Negócios/Empreendedorismo": {
    keywords: ["empresa", "negócio", "empreender", "gestão", "líder", "sucesso", "estratégia", "faturamento"],
    searchTerms: ["empreendedorismo", "gestão de negócios", "estratégia de vendas"]
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

  // Simulação de CTA (Botão) baseado no conteúdo
  let ctaText = "Saiba Mais";
  if (combinedText.includes("comprar") || combinedText.includes("oferta") || combinedText.includes("desconto")) ctaText = "Comprar Agora";
  if (combinedText.includes("whatsapp") || combinedText.includes("contato") || combinedText.includes("mensagem")) ctaText = "Enviar Mensagem";
  if (combinedText.includes("baixar") || combinedText.includes("download") || combinedText.includes("ebook")) ctaText = "Baixar";
  if (combinedText.includes("inscreva") || combinedText.includes("vagas")) ctaText = "Cadastre-se";

  return { niche: detectedNiche, productType: detectedType, ctaText };
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

  const MIN_RESULTS = 20;
  let allAds: any[] = [];
  let currentAfter = after;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  try {
    while (allAds.length < MIN_RESULTS && attempts < MAX_ATTEMPTS) {
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
          ...(currentAfter && { after: currentAfter })
        }
      });

      const rawAds = response.data.data || [];
      const paging = response.data.paging;
      
      const processed = rawAds.map((ad: any) => {
        const classification = classifyAd(ad);
        return {
          ...ad,
          detectedNiche: classification.niche,
          detectedProductType: classification.productType,
          ctaText: classification.ctaText,
          frequency: Math.floor(Math.random() * 15) + 1 // Frequência simulada para ordenação
        };
      });

      let filtered = processed;
      if (params.niche && params.niche !== "Todos") {
        filtered = filtered.filter((ad: any) => ad.detectedNiche === params.niche);
      }
      if (params.productType && params.productType !== "Todos") {
        filtered = filtered.filter((ad: any) => ad.detectedProductType === params.productType);
      }

      allAds = [...allAds, ...filtered];
      if (!paging?.next || filtered.length >= MIN_RESULTS) break;
      currentAfter = paging.cursors?.after;
      attempts++;
    }

    return {
      data: allAds,
      paging: {
        next_cursor: currentAfter
      }
    };
  } catch (error: any) {
    const errorData = error.response?.data || { error: { message: error.message } };
    logger.error(`[MetaAds] Erro na API da Meta:`, errorData);
    throw new Error(errorData.error?.message || 'Falha ao buscar anúncios na Meta');
  }
}
