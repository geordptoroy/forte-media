import axios from "axios";
import { getDb } from "../db";
import { favoriteAds, scaledAdsLibrary } from "../../drizzle/schema";
import { eq, gte, and } from "drizzle-orm";

/**
 * Serviço de Inteligência de Anúncios - Forte Media v3
 * Responsável por:
 * 1. Extrair URLs de mídia do CDN a partir do snapshot
 * 2. Calcular o Score de Escala (0-100)
 * 3. Detectar o Nicho do anúncio
 * 4. Atualizar a biblioteca de anúncios escalados
 */

// Tipos de Nicho
export type AdNiche = "Infoproduto" | "Nutra" | "SaaS" | "E-commerce" | "Imobiliário" | "Geral";
export type ScaleLevel = "Teste" | "Média" | "Alta" | "Massiva";

interface AdIntelligence {
  scaleScore: number;
  scaleLevelLabel: ScaleLevel;
  niche: AdNiche;
  daysActive: number;
  isScaledAd: boolean;
}

interface MediaUrls {
  videoUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Extrai URLs de mídia do CDN a partir da URL de snapshot
 * Usa axios para tentar extrair og:image e URLs de mídia do HTML da página
 * Nota: A Meta Ad Library é uma SPA, então a extração pode ser limitada.
 * Para extração completa, o frontend usa iframe diretamente.
 */
export async function extractMediaFromSnapshot(
  snapshotUrl: string,
  accessToken: string
): Promise<MediaUrls> {
  const mediaUrls: MediaUrls = {};

  try {
    const response = await axios.get(snapshotUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ForteMedia/3.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    const html = response.data as string;

    // Extrair og:image
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImageMatch?.[1]) {
      mediaUrls.imageUrl = ogImageMatch[1];
    }

    // Extrair og:video
    const ogVideoMatch = html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i);
    if (ogVideoMatch?.[1]) {
      mediaUrls.videoUrl = ogVideoMatch[1];
    }

    // Extrair URLs fbcdn.net de imagens
    const fbcdnImageMatches = html.match(/https:\/\/[^"'\s]*fbcdn\.net[^"'\s]*\.(jpg|png|webp)/gi);
    if (fbcdnImageMatches && fbcdnImageMatches.length > 0 && !mediaUrls.imageUrl) {
      mediaUrls.imageUrl = fbcdnImageMatches[0];
      if (fbcdnImageMatches.length > 1) {
        mediaUrls.thumbnailUrl = fbcdnImageMatches[1];
      }
    }

    // Extrair URLs fbcdn.net de vídeos
    const fbcdnVideoMatches = html.match(/https:\/\/[^"'\s]*fbcdn\.net[^"'\s]*\.mp4/gi);
    if (fbcdnVideoMatches && fbcdnVideoMatches.length > 0 && !mediaUrls.videoUrl) {
      mediaUrls.videoUrl = fbcdnVideoMatches[0];
    }

  } catch (error) {
    console.error("[AdIntelligence] Error extracting media from snapshot:", error);
  }

  return mediaUrls;
}

/**
 * Detecta o nicho do anúncio baseado no texto do criativo
 * Analisa palavras-chave por categoria para classificar automaticamente
 */
export function detectNiche(creativeBodies: string[]): AdNiche {
  const text = creativeBodies.join(" ").toLowerCase();

  const nicheKeywords: Record<AdNiche, string[]> = {
    Infoproduto: [
      "curso",
      "mentoria",
      "vagas",
      "aula",
      "aprender",
      "método",
      "treinamento",
      "workshop",
      "certificado",
      "formação",
      "ebook",
    ],
    Nutra: [
      "emagrecer",
      "natural",
      "fórmula",
      "saúde",
      "suplemento",
      "perder peso",
      "vitamina",
      "nutrição",
      "emagrecimento",
      "detox",
      "colágeno",
    ],
    SaaS: [
      "software",
      "plataforma",
      "ferramenta",
      "automação",
      "app",
      "sistema",
      "solução",
      "integração",
      "dashboard",
      "api",
      "saas",
    ],
    "E-commerce": [
      "frete",
      "loja",
      "oferta",
      "desconto",
      "compre",
      "estoque",
      "promoção",
      "venda",
      "produto",
      "entrega",
      "parcelado",
    ],
    Imobiliário: [
      "apartamento",
      "imóvel",
      "casa",
      "financiamento",
      "m²",
      "bairro",
      "terreno",
      "aluguel",
      "condomínio",
      "loteamento",
      "incorporadora",
    ],
    Geral: [],
  };

  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    if (niche === "Geral") continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return niche as AdNiche;
    }
  }

  return "Geral";
}

/**
 * Calcula o Score de Escala (0-100) baseado em critérios de performance
 *
 * Longevidade (50%): Quanto mais tempo ativo, maior a chance de ser lucrativo
 * Plataformas (20%): Presença em múltiplas plataformas indica escala
 * Variações (30%): Múltiplos criativos indicam testes e otimização
 */
export function calculateScaleScore(
  daysActive: number,
  platformCount: number,
  creativeVariations: number
): { score: number; label: ScaleLevel } {
  let score = 0;

  // Longevidade (Peso 50)
  if (daysActive > 60) score += 50;
  else if (daysActive > 30) score += 35;
  else if (daysActive > 15) score += 20;
  else if (daysActive > 7) score += 10;

  // Plataformas (Peso 20)
  if (platformCount >= 3) score += 20;
  else if (platformCount >= 2) score += 10;

  // Variações de Criativo (Peso 30)
  if (creativeVariations > 5) score += 30;
  else if (creativeVariations > 2) score += 15;

  // Determinar label
  let label: ScaleLevel = "Teste";
  if (score >= 70) label = "Massiva";
  else if (score >= 40) label = "Alta";
  else if (score >= 20) label = "Média";

  return { score, label };
}

/**
 * Processa um anúncio para adicionar inteligência e mídia
 * Orquestra extração de mídia, detecção de nicho e cálculo de escala
 */
export async function processAdIntelligence(
  adId: string,
  snapshotUrl: string,
  deliveryStartTime: Date | null,
  publisherPlatforms: string[],
  creativeBodies: string[],
  accessToken: string
): Promise<{
  intelligence: AdIntelligence;
  media: MediaUrls;
}> {
  // Extrair mídia do CDN
  const media = await extractMediaFromSnapshot(snapshotUrl, accessToken);

  // Calcular dias ativos
  const daysActive = deliveryStartTime
    ? Math.floor((Date.now() - deliveryStartTime.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Detectar nicho
  const niche = detectNiche(creativeBodies);

  // Calcular score de escala
  const { score, label } = calculateScaleScore(daysActive, publisherPlatforms.length, creativeBodies.length);

  return {
    intelligence: {
      scaleScore: score,
      scaleLevelLabel: label,
      niche,
      daysActive,
      isScaledAd: score >= 70,
    },
    media,
  };
}

/**
 * Atualiza a biblioteca de anúncios escalados
 * Adiciona novos anúncios com score >= 70 da tabela favoriteAds
 */
export async function updateScaledAdsLibrary() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar todos os anúncios com score >= 70
    const scaledAds = await db
      .select()
      .from(favoriteAds)
      .where(gte(favoriteAds.scaleScore, 70));

    // Adicionar à biblioteca (evitando duplicatas)
    for (const ad of scaledAds) {
      const existing = await db
        .select()
        .from(scaledAdsLibrary)
        .where(eq(scaledAdsLibrary.adId, ad.adId));

      if (existing.length === 0) {
        await db.insert(scaledAdsLibrary).values({
          adId: ad.adId,
          pageId: ad.pageId,
          pageName: ad.pageName,
          cdnVideoUrl: ad.cdnVideoUrl,
          cdnImageUrl: ad.cdnImageUrl,
          cdnThumbnailUrl: ad.cdnThumbnailUrl,
          adCreativeBodies: ad.adCreativeBodies,
          scaleScore: ad.scaleScore,
          niche: ad.niche,
          daysActive: ad.daysActive,
          publisherPlatforms: ad.publisherPlatforms,
          adDeliveryStartTime: ad.adDeliveryStartTime,
          adDeliveryStopTime: ad.adDeliveryStopTime,
          isActive: true,
        });
      }
    }

    console.log(`[AdIntelligence] Updated scaled ads library with ${scaledAds.length} ads`);
    return { updated: scaledAds.length };
  } catch (error) {
    console.error("[AdIntelligence] Error updating scaled ads library:", error);
    throw error;
  }
}

/**
 * Obtém anúncios escalados aleatórios para a página "Escalados"
 * Sorteia por nicho para manter variedade
 */
export async function getRandomScaledAds(limit: number = 50, niche?: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar anúncios escalados ativos (com filtro de nicho opcional)
    let query = db
      .select()
      .from(scaledAdsLibrary)
      .where(eq(scaledAdsLibrary.isActive, true));

    const ads = await query;

    // Filtrar por nicho se especificado
    const filtered = niche ? ads.filter((ad) => ad.niche === niche) : ads;

    // Embaralhar e retornar limite
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("[AdIntelligence] Error getting random scaled ads:", error);
    return [];
  }
}

/**
 * Busca avançada de anúncios com filtros de score, nicho e keywords
 * Usado pelo Minerador para encontrar anúncios relevantes
 */
export async function searchAdsWithFilters(
  userId: number,
  options: {
    keywords?: string;
    niche?: string;
    minScaleScore?: number;
    maxScaleScore?: number;
    limit?: number;
  }
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { keywords, niche, minScaleScore = 0, maxScaleScore = 100, limit = 100 } = options;

    // Buscar favoritos do usuário com filtros de score
    const allFavorites = await db
      .select()
      .from(favoriteAds)
      .where(eq(favoriteAds.userId, userId));

    // Filtrar em memória para suportar todos os critérios
    let filtered = allFavorites.filter((ad) => {
      const score = ad.scaleScore || 0;
      if (score < minScaleScore || score > maxScaleScore) return false;
      if (niche && ad.niche !== niche) return false;
      if (keywords) {
        const kw = keywords.toLowerCase();
        const bodies = (ad.adCreativeBodies || []).join(" ").toLowerCase();
        const name = (ad.pageName || "").toLowerCase();
        if (!bodies.includes(kw) && !name.includes(kw)) return false;
      }
      return true;
    });

    // Ordenar por score decrescente
    filtered.sort((a, b) => (b.scaleScore || 0) - (a.scaleScore || 0));

    return filtered.slice(0, limit);
  } catch (error) {
    console.error("[AdIntelligence] Error searching ads with filters:", error);
    return [];
  }
}
