/**
 * Scaling Validation Service — v2 (Refatorado)
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine de validação de escala de anúncios baseada em SINAIS PROXY REAIS.
 *
 * PROBLEMA DO ALGORITMO ANTERIOR:
 *   O algoritmo anterior dependia de `spend` e `impressions`, campos que a Meta
 *   NÃO fornece para anúncios comuns fora da UE/UK (ex: Brasil). Isso fazia com
 *   que todos os anúncios brasileiros recebessem score próximo de zero, tornando
 *   o sistema inútil para o público-alvo principal (infoprodutores BR/LATAM).
 *
 * SOLUÇÃO — SINAIS PROXY (baseados em pesquisa de mercado):
 *   A API da Meta foi criada para transparência, não para métricas de performance.
 *   Em vez de depender de dados que não existem, usamos sinais que ESTÃO disponíveis
 *   e que, combinados, indicam com alta precisão se um anúncio está em escala:
 *
 *   1. LONGEVIDADE (peso 40%): Anúncios lucrativos ficam no ar. Anunciantes não
 *      mantêm anúncios que não vendem. É o sinal mais forte disponível.
 *
 *   2. AINDA ATIVO (peso 15%): Anúncio sem data de encerramento = ainda veiculando.
 *      Combinado com longevidade, é um forte indicador de validação.
 *
 *   3. PRESENÇA DE COPY ESTRUTURADO (peso 15%): Anunciantes profissionais em escala
 *      têm copy definido, título e descrição. Anúncios de teste costumam ser simples.
 *
 *   4. DISTRIBUIÇÃO MULTI-PLATAFORMA (peso 15%): Anunciantes em escala distribuem
 *      em múltiplas plataformas (Facebook + Instagram + Audience Network).
 *
 *   5. FORMATO DE VÍDEO (peso 10%): Vídeo tem melhor CPM e escala mais rápido.
 *      Anunciantes que investem em produção de vídeo geralmente têm orçamento maior.
 *
 *   6. DADOS DE GASTO/IMPRESSÕES (bônus, quando disponíveis): Para anúncios da
 *      UE/UK, esses dados estão disponíveis e são usados como bônus de confirmação.
 *      Para outros países, não penalizam o score (são ignorados se ausentes).
 *
 * CLASSIFICAÇÃO FINAL:
 *   0–30:  Teste — sem sinais de escala
 *   31–60: Validação — potencial, monitorar
 *   61–100: Escalado — oferta vencedora
 *
 * Fonte de referência: Meta Ad Library API Documentation + análise de mercado
 * de infoprodutores e dropshippers brasileiros.
 */
import { logger } from "../_core/logger";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScaleLevel = "SCALED" | "MODERATE" | "LOW" | "UNKNOWN";

export interface ScalingSignal {
  signal: string;
  value: string | number;
  weight: number;
  passed: boolean;
  description: string;
}

export interface OfferValidation {
  adId: string;
  pageName: string;
  scaleLevel: ScaleLevel;
  scalingScore: number;
  isScaled: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  signals: ScalingSignal[];
  summary: string;
  recommendation: string;
  validatedAt: string;
  rawMetrics: {
    daysActive: number;
    isStillActive: boolean;
    platformCount: number;
    hasVideo: boolean;
    hasCopy: boolean;
    hasTitle: boolean;
    hasDescription: boolean;
    spendAvailable: boolean;
    spendMin: number;
    spendMax: number;
    impressionsAvailable: boolean;
    impressionsMin: number;
    impressionsMax: number;
  };
}

export interface BatchValidationResult {
  totalAds: number;
  scaledCount: number;
  moderateCount: number;
  lowCount: number;
  unknownCount: number;
  scaledPercentage: number;
  topScaledAds: OfferValidation[];
  validations: OfferValidation[];
  validatedAt: string;
}

export interface OfferScalingResult {
  offerId: string;
  offerName: string;
  totalAdsAnalyzed: number;
  scaledAdsCount: number;
  averageScore: number;
  offerScaleLevel: ScaleLevel;
  isOfferValidated: boolean;
  competitorCount: number;
  topCompetitors: string[];
  marketSignals: string[];
  offerRecommendation: string;
  adValidations: OfferValidation[];
  validatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractNumericRange(value: any): { min: number; max: number; available: boolean } {
  if (!value) return { min: 0, max: 0, available: false };

  if (typeof value === "number") {
    return { min: value, max: value, available: value > 0 };
  }

  if (typeof value === "string") {
    const n = parseFloat(value);
    return { min: n || 0, max: n || 0, available: n > 0 };
  }

  if (typeof value === "object") {
    const min = Number(value.min ?? value.lower_bound ?? 0);
    const max = Number(value.max ?? value.upper_bound ?? 0);

    if (min > 0 || max > 0) {
      return { min, max, available: true };
    }

    if (value.range) {
      const parts = value.range.split(/[-\u2013]/).map((p: string) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { min: parts[0], max: parts[1], available: parts[0] > 0 || parts[1] > 0 };
      }
      const single = parseFloat(value.range);
      return { min: single || 0, max: single || 0, available: single > 0 };
    }
  }

  return { min: 0, max: 0, available: false };
}

/**
 * Calcula quantos dias o anuncio esta/esteve ativo.
 * Se nao ha data de fim, considera que ainda esta ativo (usa data atual).
 */
function calculateDaysActive(startTime?: string, stopTime?: string): number {
  if (!startTime) return 0;
  try {
    const start = new Date(startTime).getTime();
    if (isNaN(start)) return 0;
    const end = stopTime ? new Date(stopTime).getTime() : Date.now();
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function getScaleLevel(score: number): ScaleLevel {
  if (score >= 61) return "SCALED";
  if (score >= 31) return "MODERATE";
  if (score > 0) return "LOW";
  return "UNKNOWN";
}

function getConfidence(signals: ScalingSignal[]): "HIGH" | "MEDIUM" | "LOW" {
  const passedCount = signals.filter(s => s.passed).length;
  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0);
  const passedWeight = signals.filter(s => s.passed).reduce((acc, s) => acc + s.weight, 0);
  const coverage = totalWeight > 0 ? passedWeight / totalWeight : 0;

  if (coverage >= 0.6 && passedCount >= 3) return "HIGH";
  if (coverage >= 0.3 && passedCount >= 2) return "MEDIUM";
  return "LOW";
}

function buildSummary(
  scaleLevel: ScaleLevel,
  score: number,
  daysActive: number,
  pageName: string,
  isStillActive: boolean
): string {
  const activeStr = isStillActive ? "ainda em veiculacao" : ("encerrado apos " + daysActive + " dias");
  switch (scaleLevel) {
    case "SCALED":
      return ('"' + pageName + '" esta em escala ativa (score ' + score + '/100). Anuncio com ' + daysActive + ' dias de veiculacao, ' + activeStr + '. Forte indicador de oferta validada pelo mercado.');
    case "MODERATE":
      return ('"' + pageName + '" apresenta sinais moderados de escala (score ' + score + '/100). ' + daysActive + ' dias de veiculacao — pode estar em fase de validacao ou crescimento inicial.');
    case "LOW":
      return ('"' + pageName + '" tem baixa tracao de escala (score ' + score + '/100). Anuncio com apenas ' + daysActive + ' dias ou poucos sinais de profissionalismo.');
    default:
      return ('"' + pageName + '" nao possui dados suficientes para validacao de escala.');
  }
}

function buildRecommendation(scaleLevel: ScaleLevel, daysActive: number): string {
  switch (scaleLevel) {
    case "SCALED":
      return "Oferta validada. Analise o criativo, copy e landing page para modelar a estrategia. Adicione ao monitoramento para acompanhar mudancas.";
    case "MODERATE":
      if (daysActive < 14) {
        return "Anuncio recente com bons sinais. Monitore por mais 7-14 dias. Se mantiver veiculacao, provavelmente e uma oferta em validacao.";
      }
      return "Anuncio promissor com sinais de escala moderados. Adicione ao monitoramento e verifique o criativo completo.";
    case "LOW":
      return "Poucos sinais de escala. Pode ser um anuncio de teste ou anunciante iniciante. Busque anuncios com mais tempo de veiculacao.";
    default:
      return "Dados insuficientes. Verifique se as credenciais Meta tem acesso completo a Ad Library.";
  }
}

// ─── Core Validation Engine ───────────────────────────────────────────────────

/**
 * Valida se um anuncio esta em escala usando sinais proxy.
 *
 * IMPORTANTE: Nao depende de spend/impressions (indisponiveis para BR/LATAM).
 * Usa apenas campos garantidamente disponiveis para todos os paises.
 */
export function validateAdScaling(ad: any): OfferValidation {
  const daysActive = calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
  const isStillActive = !ad.ad_delivery_stop_time;
  const platforms = Array.isArray(ad.publisher_platforms) ? ad.publisher_platforms : [];
  const isVideo = ad.media_type === "VIDEO";
  const hasCopy = !!(ad.ad_creative_bodies?.length && ad.ad_creative_bodies[0]?.trim());
  const hasTitle = !!(ad.ad_creative_link_titles?.length && ad.ad_creative_link_titles[0]?.trim());
  const hasDescription = !!(ad.ad_creative_link_descriptions?.length && ad.ad_creative_link_descriptions[0]?.trim());

  // Dados de gasto/impressoes (disponiveis apenas para UE/UK — usados como bonus)
  const spend = extractNumericRange(ad.spend);
  const impressions = extractNumericRange(ad.impressions);
  const spendMid = spend.available ? (spend.min + spend.max) / 2 : 0;
  const impressionsMid = impressions.available ? (impressions.min + impressions.max) / 2 : 0;

  // ── Signals com pesos calibrados para dados reais da Meta ─────────────────
  //
  // PESOS TOTAIS = 95 pontos (sem bonus)
  // Os sinais de spend/impressions sao BONUS (nao penalizam se ausentes)
  //
  const signals: ScalingSignal[] = [
    // ── SINAL 1: Longevidade alta (40 pts) — O sinal mais forte disponivel ────
    {
      signal: "DAYS_ACTIVE_90",
      value: daysActive,
      weight: 40,
      passed: daysActive >= 90,
      description: daysActive >= 90
        ? (daysActive + " dias no ar — forte indicador de oferta escalada e validada (>90 dias)")
        : daysActive >= 31
        ? (daysActive + " dias no ar — provavel escala (31-89 dias)")
        : daysActive >= 8
        ? (daysActive + " dias no ar — validacao em andamento (8-30 dias)")
        : (daysActive + " dias no ar — teste inicial (<7 dias)"),
    },
    // ── SINAL 1b: Longevidade moderada (25 pts) ───────────────────────────────
    {
      signal: "DAYS_ACTIVE_31",
      value: daysActive,
      weight: 25,
      passed: daysActive >= 31,
      description: daysActive >= 31
        ? (daysActive + " dias ativo — consistencia alta, oferta provavelmente lucrativa")
        : (daysActive + " dias ativo — ainda em fase inicial"),
    },
    // ── SINAL 1c: Passou da fase de teste (10 pts) ────────────────────────────
    {
      signal: "DAYS_ACTIVE_8",
      value: daysActive,
      weight: 10,
      passed: daysActive >= 8,
      description: daysActive >= 8
        ? (daysActive + " dias ativo — passou da fase de teste inicial")
        : (daysActive + " dias ativo — teste muito recente"),
    },

    // ── SINAL 2: Ainda ativo (15 pts) ─────────────────────────────────────────
    {
      signal: "STILL_ACTIVE",
      value: isStillActive ? "sim" : "nao",
      weight: 15,
      passed: isStillActive,
      description: isStillActive
        ? "Anuncio ainda em veiculacao ativa — anunciante continua investindo"
        : "Anuncio pausado ou encerrado — pode ter sido substituido por versao melhor",
    },

    // ── SINAL 3: Copy estruturado (15 pts) ────────────────────────────────────
    {
      signal: "HAS_FULL_CREATIVE",
      value: [hasCopy, hasTitle, hasDescription].filter(Boolean).length,
      weight: 15,
      passed: hasCopy && hasTitle,
      description: hasCopy && hasTitle && hasDescription
        ? "Criativo completo: copy + titulo + descricao — anunciante profissional em escala"
        : hasCopy && hasTitle
        ? "Criativo com copy e titulo — bom nivel de profissionalismo"
        : hasCopy
        ? "Copy presente mas sem titulo — criativo parcial"
        : "Sem copy detectado — criativo apenas visual ou dados incompletos",
    },

    // ── SINAL 4: Multi-plataforma (15 pts) ────────────────────────────────────
    {
      signal: "MULTI_PLATFORM",
      value: platforms.length,
      weight: 15,
      passed: platforms.length >= 2,
      description: platforms.length >= 3
        ? ("Veiculado em " + platforms.length + " plataformas: " + platforms.join(", ") + " — escala maxima de distribuicao")
        : platforms.length === 2
        ? ("Veiculado em 2 plataformas: " + platforms.join(", ") + " — boa distribuicao")
        : platforms.length === 1
        ? ("Apenas 1 plataforma: " + (platforms[0] || "desconhecida") + " — distribuicao limitada")
        : "Sem dados de plataforma",
    },

    // ── SINAL 5: Formato de video (10 pts) ────────────────────────────────────
    {
      signal: "VIDEO_FORMAT",
      value: ad.media_type || "UNKNOWN",
      weight: 10,
      passed: isVideo,
      description: isVideo
        ? "Formato de video — maior engajamento, melhor CPM, escala mais rapida"
        : ad.media_type === "IMAGE"
        ? "Formato imagem — funciona bem, mas video tende a escalar melhor"
        : ("Formato " + (ad.media_type || "desconhecido")),
    },

    // ── BONUS: Dados de gasto (disponiveis apenas para UE/UK) ─────────────────
    // Peso 0 = nao conta no total, mas aparece nos signals para informacao
    {
      signal: "SPEND_BONUS",
      value: spendMid,
      weight: 0,
      passed: spend.available && spendMid >= 500,
      description: spend.available
        ? spendMid >= 500
          ? ("[BONUS] Gasto elevado confirmado: ~$" + spendMid.toFixed(0) + " (dados UE/UK disponiveis)")
          : ("[INFO] Gasto detectado: ~$" + spendMid.toFixed(0) + " (dados UE/UK)")
        : "[INFO] Dados de gasto nao disponiveis para este pais (normal para BR/LATAM)",
    },

    // ── BONUS: Dados de impressoes (disponiveis apenas para UE/UK) ────────────
    {
      signal: "IMPRESSIONS_BONUS",
      value: impressionsMid,
      weight: 0,
      passed: impressions.available && impressionsMid >= 50000,
      description: impressions.available
        ? impressionsMid >= 50000
          ? ("[BONUS] Alto alcance confirmado: ~" + impressionsMid.toLocaleString("pt-BR") + " impressoes")
          : ("[INFO] Alcance detectado: ~" + impressionsMid.toLocaleString("pt-BR") + " impressoes")
        : "[INFO] Dados de impressoes nao disponiveis para este pais (normal para BR/LATAM)",
    },
  ];

  // ── Score calculation ────────────────────────────────────────────────────
  // Apenas signals com weight > 0 contam para o score
  const scoringSignals = signals.filter(s => s.weight > 0);
  const totalWeight = scoringSignals.reduce((acc, s) => acc + s.weight, 0);
  const earnedWeight = scoringSignals.filter(s => s.passed).reduce((acc, s) => acc + s.weight, 0);
  const baseScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Bonus de ate 10 pontos quando dados de gasto/impressoes confirmam escala
  let bonusScore = 0;
  if (spend.available && spendMid >= 500) bonusScore += 5;
  if (impressions.available && impressionsMid >= 50000) bonusScore += 5;

  const scalingScore = Math.min(100, baseScore + bonusScore);
  const scaleLevel = getScaleLevel(scalingScore);
  const confidence = getConfidence(scoringSignals);
  const summary = buildSummary(scaleLevel, scalingScore, daysActive, ad.page_name || "Anunciante", isStillActive);
  const recommendation = buildRecommendation(scaleLevel, daysActive);

  return {
    adId: ad.id || ad.ad_archive_id || "unknown",
    pageName: ad.page_name || "Desconhecido",
    scaleLevel,
    scalingScore,
    isScaled: scaleLevel === "SCALED",
    confidence,
    signals,
    summary,
    recommendation,
    validatedAt: new Date().toISOString(),
    rawMetrics: {
      daysActive,
      isStillActive,
      platformCount: platforms.length,
      hasVideo: isVideo,
      hasCopy,
      hasTitle,
      hasDescription,
      spendAvailable: spend.available,
      spendMin: spend.min,
      spendMax: spend.max,
      impressionsAvailable: impressions.available,
      impressionsMin: impressions.min,
      impressionsMax: impressions.max,
    },
  };
}

// ─── Offer Validation ─────────────────────────────────────────────────────────

export function validateOfferScaling(
  offerName: string,
  ads: any[]
): OfferScalingResult {
  if (!ads || ads.length === 0) {
    return {
      offerId: ("offer_" + Date.now()),
      offerName,
      totalAdsAnalyzed: 0,
      scaledAdsCount: 0,
      averageScore: 0,
      offerScaleLevel: "UNKNOWN",
      isOfferValidated: false,
      competitorCount: 0,
      topCompetitors: [],
      marketSignals: ["Nenhum anuncio encontrado para esta oferta"],
      offerRecommendation: "Sem dados suficientes. Tente buscar com termos mais amplos.",
      adValidations: [],
      validatedAt: new Date().toISOString(),
    };
  }

  const adValidations = ads.map(ad => validateAdScaling(ad));
  const scaledAds = adValidations.filter(v => v.isScaled);
  const averageScore = Math.round(
    adValidations.reduce((acc, v) => acc + v.scalingScore, 0) / adValidations.length
  );

  const uniquePages = Array.from(new Set(ads.map((ad: any) => ad.page_name).filter(Boolean)));
  const topCompetitors = uniquePages.slice(0, 5);

  const marketSignals: string[] = [];
  const scaledPct = (scaledAds.length / adValidations.length) * 100;

  if (scaledPct >= 50) {
    marketSignals.push(scaledPct.toFixed(0) + "% dos anuncios estao em escala — mercado aquecido e validado");
  } else if (scaledPct >= 20) {
    marketSignals.push(scaledPct.toFixed(0) + "% dos anuncios em escala — mercado em crescimento");
  } else {
    marketSignals.push("Apenas " + scaledPct.toFixed(0) + "% dos anuncios em escala — mercado frio ou nicho pouco explorado");
  }

  if (uniquePages.length >= 10) {
    marketSignals.push(uniquePages.length + " anunciantes distintos — alta competicao, oferta validada pelo mercado");
  } else if (uniquePages.length >= 3) {
    marketSignals.push(uniquePages.length + " anunciantes distintos — competicao moderada");
  } else {
    marketSignals.push("Apenas " + uniquePages.length + " anunciante(s) — nicho pouco explorado ou termos muito especificos");
  }

  const videoAds = adValidations.filter(v => v.rawMetrics.hasVideo).length;
  if (videoAds > adValidations.length * 0.5) {
    marketSignals.push(videoAds + " anuncios em video (" + Math.round(videoAds / adValidations.length * 100) + "%) — video e o formato dominante neste nicho");
  }

  const avgDays = Math.round(
    adValidations.reduce((acc, v) => acc + v.rawMetrics.daysActive, 0) / adValidations.length
  );
  if (avgDays >= 90) {
    marketSignals.push("Media de " + avgDays + " dias de veiculacao — ofertas longevas e altamente validadas");
  } else if (avgDays >= 30) {
    marketSignals.push("Media de " + avgDays + " dias de veiculacao — mercado em amadurecimento");
  } else if (avgDays >= 8) {
    marketSignals.push("Media de " + avgDays + " dias de veiculacao — mercado em fase de teste");
  }

  const stillActiveCount = adValidations.filter(v => v.rawMetrics.isStillActive).length;
  if (stillActiveCount > adValidations.length * 0.7) {
    marketSignals.push(stillActiveCount + " anuncios ainda ativos — anunciantes continuam investindo nesta oferta");
  }

  let offerScaleLevel: ScaleLevel;
  if (averageScore >= 61 && scaledPct >= 30) offerScaleLevel = "SCALED";
  else if (averageScore >= 40 || scaledPct >= 15) offerScaleLevel = "MODERATE";
  else if (averageScore > 10) offerScaleLevel = "LOW";
  else offerScaleLevel = "UNKNOWN";

  const isOfferValidated = offerScaleLevel === "SCALED" || (offerScaleLevel === "MODERATE" && scaledPct >= 20);

  let offerRecommendation: string;
  if (isOfferValidated) {
    offerRecommendation = 'Oferta "' + offerName + '" VALIDADA pelo mercado. ' + scaledAds.length + ' anuncios em escala com score medio ' + averageScore + '/100. Analise os criativos dos top competidores: ' + topCompetitors.slice(0, 3).join(", ") + '.';
  } else if (offerScaleLevel === "MODERATE") {
    offerRecommendation = 'Oferta "' + offerName + '" em fase de validacao. Mercado existe mas ainda nao aquecido. Monitore por 7-14 dias antes de investir.';
  } else {
    offerRecommendation = 'Oferta "' + offerName + '" sem validacao de mercado suficiente. Considere outro nicho ou ajuste os termos de busca.';
  }

  return {
    offerId: ("offer_" + Date.now()),
    offerName,
    totalAdsAnalyzed: adValidations.length,
    scaledAdsCount: scaledAds.length,
    averageScore,
    offerScaleLevel,
    isOfferValidated,
    competitorCount: uniquePages.length,
    topCompetitors,
    marketSignals,
    offerRecommendation,
    adValidations: adValidations.sort((a, b) => b.scalingScore - a.scalingScore),
    validatedAt: new Date().toISOString(),
  };
}

// ─── Batch Validation ─────────────────────────────────────────────────────────

export function validateAdsBatch(ads: any[]): BatchValidationResult {
  const validations = ads.map(ad => validateAdScaling(ad));
  const scaledCount = validations.filter(v => v.scaleLevel === "SCALED").length;
  const moderateCount = validations.filter(v => v.scaleLevel === "MODERATE").length;
  const lowCount = validations.filter(v => v.scaleLevel === "LOW").length;
  const unknownCount = validations.filter(v => v.scaleLevel === "UNKNOWN").length;

  return {
    totalAds: validations.length,
    scaledCount,
    moderateCount,
    lowCount,
    unknownCount,
    scaledPercentage: validations.length > 0 ? Math.round((scaledCount / validations.length) * 100) : 0,
    topScaledAds: validations
      .filter(v => v.isScaled)
      .sort((a, b) => b.scalingScore - a.scalingScore)
      .slice(0, 10),
    validations: validations.sort((a, b) => b.scalingScore - a.scalingScore),
    validatedAt: new Date().toISOString(),
  };
}
