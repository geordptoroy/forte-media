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

// Dicionário de Nichos com Palavras-Chave Expandidas
const NICHE_KEYWORDS: Record<string, string[]> = {
  "Relacionamento": ["namoro", "casamento", "conquista", "relacionamento", "ex", "seduzir", "reconquista", "parceiro", "esposa", "marido"],
  "Espiritualidade": ["deus", "fé", "oração", "espiritual", "alma", "meditação", "universo", "astrologia", "signo", "manifestação", "lei da atração"],
  "Renda Extra": ["dinheiro", "ganhar", "renda", "trabalhar em casa", "lucro", "vendas", "afiliado", "dropshipping", "marketing digital", "comissão", "liberdade financeira"],
  "Emagrecimento": ["perder peso", "emagrecer", "dieta", "jejum", "queimar gordura", "detox", "fitness", "barriga", "peso", "calorias", "receitas fit"],
  "Marketing Digital": ["tráfego", "lançamento", "copywriting", "vendas online", "anúncios", "leads", "conversão", "funil", "pixel", "escala"],
  "Finanças/Investimentos": ["investir", "bolsa", "ações", "cripto", "tesouro", "dividendos", "poupando", "bitcoin", "mercado financeiro", "trade"],
  "Saúde & Fitness": ["treino", "academia", "músculo", "saúde", "suplemento", "corpo", "hipertrofia", "exercício", "performance"],
  "Beleza & Estética": ["pele", "cabelo", "maquiagem", "unhas", "estética", "rosto", "beleza", "rugas", "rejuvenescimento", "colágeno"],
  "Culinária/Receitas": ["receita", "cozinhar", "bolo", "doce", "chef", "comida", "sabor", "gastronomia", "cozinha"],
  "Maternidade/Paternidade": ["bebê", "filho", "mãe", "pai", "gravidez", "criança", "educação", "fralda", "amamentação"],
  "Idiomas": ["inglês", "espanhol", "falar", "fluente", "curso de", "idioma", "aprender", "vocabulário"],
  "Tecnologia/Programação": ["código", "python", "javascript", "dev", "software", "tecnologia", "programador", "ti", "web"],
  "Negócios/Empreendedorismo": ["empresa", "negócio", "empreender", "gestão", "líder", "sucesso", "estratégia", "faturamento"]
};

const PRODUCT_TYPE_KEYWORDS: Record<string, string[]> = {
  "Infoproduto": ["curso", "e-book", "mentoria", "aula", "treinamento", "digital", "pdf", "acesso imediato", "vagas", "inscrição"],
  "Nutra": ["suplemento", "vitamina", "natural", "cápsula", "saúde", "fórmula", "extrato", "gotas", "comprimido"],
  "Encapsulado": ["pote", "frasco", "cápsulas", "tratamento", "entrega", "frete", "estoque", "unidades", "frascos"]
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

function classifyAd(ad: any) {
  const body = (ad.ad_creative_bodies?.[0] || "").toLowerCase();
  const title = (ad.ad_creative_link_titles?.[0] || "").toLowerCase();
  const combinedText = `${body} ${title}`;

  let detectedNiche = "Outros";
  let detectedType = "Infoproduto"; // Default

  // Classificação de Nicho
  for (const [n, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(k => combinedText.includes(k))) {
      detectedNiche = n;
      break;
    }
  }

  // Classificação de Tipo de Produto
  for (const [t, keywords] of Object.entries(PRODUCT_TYPE_KEYWORDS)) {
    if (keywords.some(k => combinedText.includes(k))) {
      detectedType = t;
      break;
    }
  }

  return { niche: detectedNiche, productType: detectedType };
}

export async function searchAds(params: SearchAdsParams) {
  const accessToken = params.accessToken || process.env.META_ACCESS_TOKEN || FALLBACK_TOKEN;
  const { searchTerms, country = 'BR', adType = 'ALL', limit = 100, activeSince } = params;

  const url = `https://graph.facebook.com/v22.0/ads_archive`;
  
  // Filtro de data de início (Meta API nativo)
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
    logger.info(`[MetaAds] Iniciando busca robusta: "${searchTerms}" | País: ${country} | Categoria: ${adType}`);
    
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        search_terms: searchTerms,
        ad_type: adType,
        ad_reached_countries: `['${country}']`,
        fields: ALL_FIELDS.join(','),
        limit: limit,
        ad_active_status: 'ACTIVE', // Focar apenas em anúncios ativos para mineração
        ...(start_date_min && { ad_delivery_start_time_min: start_date_min })
      }
    });

    const rawAds = response.data.data || [];
    logger.info(`[MetaAds] ${rawAds.length} anúncios brutos recebidos da API.`);
    
    // Processamento e Classificação em Memória
    const processedAds = rawAds.map((ad: any) => {
      const classification = classifyAd(ad);
      
      // Simulação de frequência baseada em similaridade de corpo (opcional, aqui simplificado)
      const frequency = Math.floor(Math.random() * 8) + 1; 

      return {
        ...ad,
        detectedNiche: classification.niche,
        detectedProductType: classification.productType,
        frequency
      };
    });

    // Aplicação de Filtros de Precisão (Pós-API)
    let filteredAds = processedAds;

    if (params.niche && params.niche !== "Todos") {
      filteredAds = filteredAds.filter((ad: any) => ad.detectedNiche === params.niche);
      logger.info(`[MetaAds] Filtrado por Nicho (${params.niche}): ${filteredAds.length} restantes.`);
    }

    if (params.productType && params.productType !== "Todos") {
      filteredAds = filteredAds.filter((ad: any) => ad.detectedProductType === params.productType);
      logger.info(`[MetaAds] Filtrado por Tipo (${params.productType}): ${filteredAds.length} restantes.`);
    }

    return filteredAds;
  } catch (error: any) {
    const errorData = error.response?.data || { error: { message: error.message } };
    logger.error(`[MetaAds] Erro na API da Meta:`, errorData);
    throw new Error(errorData.error?.message || 'Falha ao buscar anúncios na Meta');
  }
}
