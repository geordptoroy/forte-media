/**
 * useScalingValidation
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook para validação de escala de anúncios e ofertas via tRPC.
 * Fornece funções para validar anúncios individuais, em lote e ofertas completas.
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type ScaleLevel = "SCALED" | "MODERATE" | "LOW" | "UNKNOWN";

export interface ScalingSignal {
  signal: string;
  value: string | number;
  weight: number;
  passed: boolean;
  description: string;
}

export interface AdValidation {
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

export interface BatchResult {
  totalAds: number;
  scaledCount: number;
  moderateCount: number;
  lowCount: number;
  unknownCount: number;
  scaledPercentage: number;
  topScaledAds: AdValidation[];
  validations: AdValidation[];
  validatedAt: string;
}

export interface OfferResult {
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
  adValidations: AdValidation[];
  validatedAt: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useScalingValidation() {
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [offerResult, setOfferResult] = useState<OfferResult | null>(null);
  const [isValidatingBatch, setIsValidatingBatch] = useState(false);
  const [isValidatingOffer, setIsValidatingOffer] = useState(false);

  const validateBatchMutation = trpc.scalingValidation.validateAdsBatch.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setBatchResult(data.data as BatchResult);
        toast.success(
          `${data.data.scaledCount} de ${data.data.totalAds} anúncios em escala (${data.data.scaledPercentage}%)`
        );
      } else {
        toast.error(data.error || "Erro na validação em lote");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro na validação em lote");
    },
    onSettled: () => setIsValidatingBatch(false),
  });

  /**
   * Valida um conjunto de anúncios já carregados no frontend.
   * Não faz nova chamada à Meta API — usa os dados já disponíveis.
   */
  const validateBatch = useCallback(
    async (ads: any[]) => {
      if (!ads || ads.length === 0) {
        toast.error("Nenhum anúncio para validar");
        return;
      }
      setIsValidatingBatch(true);
      validateBatchMutation.mutate({ ads });
    },
    [validateBatchMutation]
  );

  /**
   * Retorna o nível de escala de um anúncio individual de forma síncrona,
   * sem chamada ao servidor (usa os dados já presentes no objeto ad).
   * Útil para exibir badges inline nos cards.
   */
  const getAdScaleLevel = useCallback((ad: any): ScaleLevel => {
    const score = ad.scalingScore;
    if (score === undefined) return "UNKNOWN";
    if (score >= 70) return "SCALED";
    if (score >= 40) return "MODERATE";
    return "LOW";
  }, []);

  /**
   * Retorna label e cor para o nível de escala.
   */
  const getScaleLevelDisplay = useCallback((level: ScaleLevel) => {
    const map = {
      SCALED: { label: "Escalado", colorClass: "text-green-400", bgClass: "bg-green-500/[0.06]", borderClass: "border-green-500/20" },
      MODERATE: { label: "Em Escala", colorClass: "text-yellow-400", bgClass: "bg-yellow-500/[0.06]", borderClass: "border-yellow-500/20" },
      LOW: { label: "Baixo", colorClass: "text-gray-500", bgClass: "bg-transparent", borderClass: "border-white/[0.08]" },
      UNKNOWN: { label: "Sem dados", colorClass: "text-gray-600", bgClass: "bg-transparent", borderClass: "border-white/[0.06]" },
    };
    return map[level];
  }, []);

  return {
    // State
    batchResult,
    offerResult,
    isValidatingBatch,
    isValidatingOffer,

    // Actions
    validateBatch,

    // Helpers
    getAdScaleLevel,
    getScaleLevelDisplay,

    // Reset
    clearBatchResult: () => setBatchResult(null),
    clearOfferResult: () => setOfferResult(null),
  };
}
