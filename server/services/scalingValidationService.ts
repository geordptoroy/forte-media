/**
 * Scaling Validation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine de validação de escala de anúncios e ofertas baseada nos dados
 * retornados pela Meta Ads Library API. Aplica heurísticas comerciais reais
 * para determinar se um anúncio está em escala ativa, em crescimento ou
 * sem tração suficiente.
 *
 * Critérios de escala baseados em dados da Meta:
 *  - Gasto estimado (spend): proxy de investimento real
 *  - Impressões (impressions): proxy de alcance e distribuição
 *  - Dias ativos (ad_delivery_start_time): longevidade = validação de mercado
 *  - Plataformas (publisher_platforms): distribuição multi-canal = escala
 *  - Tipo de mídia (media_type): vídeo tem melhor CPM e escala mais rápido
 *  - Presença de copy (ad_creative_bodies): criativo estruturado = profissional
 *  - Ausência de data de fim (ad_delivery_stop_time): ainda veiculando
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
    spendMin: number;
    spendMax: number;
    impressionsMin: number;
    impressionsMax: number;
    daysActive: number;
    platformCount: number;
    hasVideo: boolean;
    hasCopy: boolean;
    isStillActive: boolean;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractNumericRange(value: any): { min: number; max: number } {
  if (!value) return { min: 0, max: 0 };
  if (typeof value === "number") return { min: value, max: value };
  if (typeof value === "string") {
    const n = parseFloat(value);
    return { min: n || 0, max: n || 0 };
  }
  if (typeof value === "object") {
    const min = value.min ?? value.lower_bound ?? 0;
    const max = value.max ?? value.upper_bound ?? 0;
    if (min > 0 || max > 0) return { min: Number(min), max: Number(max) };
    if (value.range) {
      const parts = value.range.split(/[-–]/).map((p: string) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { min: parts[0], max: parts[1] };
      }
      const single = parseFloat(value.range);
      return { min: single || 0, max: single || 0 };
    }
  }
  return { min: 0, max: 0 };
}

function calculateDaysActive(startTime?: string, stopTime?: string): number {
  if (!startTime) return 0;
  try {
    const start = new Date(startTime).getTime();
    const end = stopTime ? new Date(stopTime).getTime() : Date.now();
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function getScaleLevel(score: number): ScaleLevel {
  if (score >= 70) return "SCALED";
  if (score >= 40) return "MODERATE";
  if (score > 0) return "LOW";
  return "UNKNOWN";
}

function getConfidence(signals: ScalingSignal[]): "HIGH" | "MEDIUM" | "LOW" {
  const passedCount = signals.filter(s => s.passed).length;
  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0);
  const passedWeight = signals.filter(s => s.passed).reduce((acc, s) => acc + s.weight, 0);
  const coverage = passedWeight / totalWeight;

  if (coverage >= 0.6 && passedCount >= 3) return "HIGH";
  if (coverage >= 0.3 && passedCount >= 2) return "MEDIUM";
  return "LOW";
}

function buildSummary(scaleLevel: ScaleLevel, score: number, daysActive: number, pageName: string): string {
  switch (scaleLevel) {
    case "SCALED":
      return `"${pageName}" está em escala ativa com score ${score}/100. Anúncio com ${daysActive} dias de veiculação e alto investimento detectado.`;
    case "MODERATE":
      return `"${pageName}" apresenta sinais moderados de escala (score ${score}/100). Pode estar em fase de teste ou crescimento inicial.`;
    case "LOW":
      return `"${pageName}" tem baixa tração de escala (score ${score}/100). Investimento insuficiente ou anúncio recente.`;
    default:
      return `"${pageName}" não possui dados suficientes para validação de escala.`;
  }
}

function buildRecommendation(scaleLevel: ScaleLevel, signals: ScalingSignal[]): string {
  const failedSignals = signals.filter(s => !s.passed).map(s => s.signal);

  switch (scaleLevel) {
    case "SCALED":
      return "Anúncio validado para espionagem. Analise o criativo, copy e oferta para replicar a estratégia.";
    case "MODERATE":
      if (failedSignals.includes("SPEND_HIGH")) {
        return "Aguarde mais dados de gasto. O anúncio pode estar em fase de otimização de campanha.";
      }
      if (failedSignals.includes("DAYS_ACTIVE_30")) {
        return "Monitore por mais 7-14 dias. Se mantiver veiculação, provavelmente é uma oferta validada.";
      }
      return "Anúncio promissor. Adicione ao monitoramento para acompanhar a evolução.";
    case "LOW":
      return "Não recomendado para replicação. Busque anúncios com maior tempo de veiculação e investimento.";
    default:
      return "Dados insuficientes. Verifique se as credenciais Meta têm acesso completo à Ad Library.";
  }
}

// ─── Core Validation Engine ───────────────────────────────────────────────────

export function validateAdScaling(ad: any): OfferValidation {
  const spend = extractNumericRange(ad.spend);
  const impressions = extractNumericRange(ad.impressions);
  const daysActive = calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
  const platforms = ad.publisher_platforms || [];
  const isVideo = ad.media_type === "VIDEO";
  const hasCopy = !!(ad.ad_creative_bodies?.length || ad.body);
  const isStillActive = !ad.ad_delivery_stop_time;
  const spendMid = (spend.min + spend.max) / 2;
  const impressionsMid = (impressions.min + impressions.max) / 2;

  // ── Signals com pesos comerciais ────────────────────────────────────────
  const signals: ScalingSignal[] = [
    // Gasto: principal indicador de validação de mercado
    {
      signal: "SPEND_HIGH",
      value: spendMid,
      weight: 25,
      passed: spendMid >= 500 || spend.min >= 200,
      description: spendMid >= 500
        ? `Gasto elevado detectado: ~$${spendMid.toFixed(0)} (forte sinal de escala)`
        : spend.min >= 200
        ? `Gasto mínimo de $${spend.min} indica investimento real`
        : `Gasto insuficiente para confirmar escala (~$${spendMid.toFixed(0)})`,
    },
    {
      signal: "SPEND_MODERATE",
      value: spendMid,
      weight: 10,
      passed: spendMid >= 50 || spend.min >= 20,
      description: spendMid >= 50
        ? `Gasto moderado: ~$${spendMid.toFixed(0)}`
        : `Gasto baixo: ~$${spendMid.toFixed(0)}`,
    },

    // Impressões: proxy de distribuição e alcance
    {
      signal: "IMPRESSIONS_HIGH",
      value: impressionsMid,
      weight: 20,
      passed: impressionsMid >= 50000 || impressions.min >= 10000,
      description: impressionsMid >= 50000
        ? `Alto alcance: ~${impressionsMid.toLocaleString("pt-BR")} impressões`
        : impressions.min >= 10000
        ? `Alcance mínimo de ${impressions.min.toLocaleString("pt-BR")} impressões`
        : `Alcance baixo: ~${impressionsMid.toLocaleString("pt-BR")} impressões`,
    },
    {
      signal: "IMPRESSIONS_MODERATE",
      value: impressionsMid,
      weight: 5,
      passed: impressionsMid >= 5000 || impressions.min >= 1000,
      description: `Alcance moderado: ~${impressionsMid.toLocaleString("pt-BR")} impressões`,
    },

    // Longevidade: anúncios que ficam no ar são validados pelo mercado
    {
      signal: "DAYS_ACTIVE_30",
      value: daysActive,
      weight: 20,
      passed: daysActive >= 30,
      description: daysActive >= 30
        ? `${daysActive} dias ativo — alta consistência, oferta validada`
        : `Apenas ${daysActive} dias ativo — dados insuficientes de longevidade`,
    },
    {
      signal: "DAYS_ACTIVE_14",
      value: daysActive,
      weight: 10,
      passed: daysActive >= 14,
      description: daysActive >= 14
        ? `${daysActive} dias ativo — boa consistência`
        : `${daysActive} dias ativo — anúncio recente`,
    },
    {
      signal: "DAYS_ACTIVE_7",
      value: daysActive,
      weight: 5,
      passed: daysActive >= 7,
      description: `${daysActive} dias ativo`,
    },

    // Ainda ativo: sinal de que o anunciante não pausou
    {
      signal: "STILL_ACTIVE",
      value: isStillActive ? "sim" : "não",
      weight: 8,
      passed: isStillActive,
      description: isStillActive
        ? "Anúncio ainda em veiculação ativa"
        : "Anúncio pausado ou encerrado",
    },

    // Multi-plataforma: escala real envolve múltiplos canais
    {
      signal: "MULTI_PLATFORM",
      value: platforms.length,
      weight: 10,
      passed: platforms.length >= 2,
      description: platforms.length >= 2
        ? `Veiculado em ${platforms.length} plataformas: ${platforms.join(", ")}`
        : platforms.length === 1
        ? `Apenas 1 plataforma: ${platforms[0] || "desconhecida"}`
        : "Sem dados de plataforma",
    },

    // Vídeo: melhor performance e CPM em escala
    {
      signal: "VIDEO_FORMAT",
      value: ad.media_type || "UNKNOWN",
      weight: 7,
      passed: isVideo,
      description: isVideo
        ? "Formato de vídeo — maior engajamento e escala mais rápida"
        : `Formato ${ad.media_type || "desconhecido"} — vídeo tende a escalar melhor`,
    },

    // Copy estruturado: anunciante profissional
    {
      signal: "HAS_COPY",
      value: hasCopy ? "sim" : "não",
      weight: 5,
      passed: hasCopy,
      description: hasCopy
        ? "Criativo com copy definido — anunciante profissional"
        : "Sem copy detectado — criativo pode ser apenas visual",
    },
  ];

  // ── Score calculation ────────────────────────────────────────────────────
  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0);
  const earnedWeight = signals.filter(s => s.passed).reduce((acc, s) => acc + s.weight, 0);
  const scalingScore = Math.min(100, Math.round((earnedWeight / totalWeight) * 100));

  const scaleLevel = getScaleLevel(scalingScore);
  const confidence = getConfidence(signals);
  const summary = buildSummary(scaleLevel, scalingScore, daysActive, ad.page_name || "Anunciante");
  const recommendation = buildRecommendation(scaleLevel, signals);

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
      spendMin: spend.min,
      spendMax: spend.max,
      impressionsMin: impressions.min,
      impressionsMax: impressions.max,
      daysActive,
      platformCount: platforms.length,
      hasVideo: isVideo,
      hasCopy,
      isStillActive,
    },
  };
}

// ─── Offer Validation (validates if an offer/product is worth scaling) ────────

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

export function validateOfferScaling(
  offerName: string,
  ads: any[]
): OfferScalingResult {
  if (!ads || ads.length === 0) {
    return {
      offerId: `offer_${Date.now()}`,
      offerName,
      totalAdsAnalyzed: 0,
      scaledAdsCount: 0,
      averageScore: 0,
      offerScaleLevel: "UNKNOWN",
      isOfferValidated: false,
      competitorCount: 0,
      topCompetitors: [],
      marketSignals: ["Nenhum anúncio encontrado para esta oferta"],
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

  // Unique advertisers = competitors
  const uniquePages = Array.from(new Set(ads.map((ad: any) => ad.page_name).filter(Boolean)));
  const topCompetitors = uniquePages.slice(0, 5);

  // Market signals
  const marketSignals: string[] = [];
  const scaledPct = (scaledAds.length / adValidations.length) * 100;

  if (scaledPct >= 50) {
    marketSignals.push(`${scaledPct.toFixed(0)}% dos anúncios estão em escala — mercado aquecido`);
  } else if (scaledPct >= 20) {
    marketSignals.push(`${scaledPct.toFixed(0)}% dos anúncios em escala — mercado em crescimento`);
  } else {
    marketSignals.push(`Apenas ${scaledPct.toFixed(0)}% dos anúncios em escala — mercado frio ou nicho`);
  }

  if (uniquePages.length >= 10) {
    marketSignals.push(`${uniquePages.length} anunciantes distintos — alta competição`);
  } else if (uniquePages.length >= 3) {
    marketSignals.push(`${uniquePages.length} anunciantes distintos — competição moderada`);
  } else {
    marketSignals.push(`Apenas ${uniquePages.length} anunciante(s) — nicho pouco explorado`);
  }

  const videoAds = adValidations.filter(v => v.rawMetrics.hasVideo).length;
  if (videoAds > adValidations.length * 0.5) {
    marketSignals.push(`${videoAds} anúncios em vídeo — formato dominante neste nicho`);
  }

  const avgDays = Math.round(
    adValidations.reduce((acc, v) => acc + v.rawMetrics.daysActive, 0) / adValidations.length
  );
  if (avgDays >= 30) {
    marketSignals.push(`Média de ${avgDays} dias de veiculação — ofertas longevas e validadas`);
  } else if (avgDays >= 14) {
    marketSignals.push(`Média de ${avgDays} dias de veiculação — mercado em amadurecimento`);
  }

  // Offer level determination
  let offerScaleLevel: ScaleLevel;
  if (averageScore >= 65 && scaledPct >= 30) offerScaleLevel = "SCALED";
  else if (averageScore >= 40 || scaledPct >= 15) offerScaleLevel = "MODERATE";
  else if (averageScore > 10) offerScaleLevel = "LOW";
  else offerScaleLevel = "UNKNOWN";

  const isOfferValidated = offerScaleLevel === "SCALED" || (offerScaleLevel === "MODERATE" && scaledPct >= 20);

  // Recommendation
  let offerRecommendation: string;
  if (isOfferValidated) {
    offerRecommendation = `Oferta "${offerName}" VALIDADA pelo mercado. ${scaledAds.length} anúncios em escala com score médio ${averageScore}. Analise os criativos dos top competidores: ${topCompetitors.slice(0, 3).join(", ")}.`;
  } else if (offerScaleLevel === "MODERATE") {
    offerRecommendation = `Oferta "${offerName}" em fase de validação. Mercado existe mas ainda não aquecido. Monitore por 7-14 dias antes de investir.`;
  } else {
    offerRecommendation = `Oferta "${offerName}" sem validação de mercado suficiente. Considere outro nicho ou ajuste os termos de busca.`;
  }

  return {
    offerId: `offer_${Date.now()}`,
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
