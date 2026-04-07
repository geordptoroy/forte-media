/**
 * Scaling Validation Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoints tRPC para validação de escala de anúncios e ofertas via Meta API.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getMetaCredentials } from "./metaCredentials";
import { searchAdsArchive } from "./services/metaAdsService";
import {
  validateAdScaling,
  validateAdsBatch,
  validateOfferScaling,
} from "./services/scalingValidationService";
import { logger } from "./_core/logger";

export const scalingValidationRouter = router({

  /**
   * Valida um único anúncio pelo ID (ad_archive_id)
   * Busca os dados atuais na Meta API e aplica a engine de validação
   */
  validateAd: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1, "Ad ID é obrigatório"),
        pageId: z.string().optional(),
        countries: z.array(z.string()).default(["BR"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const creds = await getMetaCredentials(ctx.user.id);
      if (!creds || !creds.isValid) {
        return { success: false, error: "Credenciais Meta não configuradas ou inválidas." };
      }

      try {
        // Busca o anúncio específico na Meta API
        const result = await searchAdsArchive({
          userId: ctx.user.id,
          accessToken: creds.accessToken,
          adReachedCountries: input.countries,
          searchTerms: ".",
          adType: "ALL",
          limit: 1,
          fields: [
            "id", "page_id", "page_name", "ad_snapshot_url",
            "ad_delivery_start_time", "ad_delivery_stop_time",
            "publisher_platforms", "ad_creative_bodies",
            "ad_creative_link_titles", "ad_creative_link_descriptions",
            "currency", "spend", "impressions", "media_type",
          ],
        });

        // Encontra o anúncio específico ou usa o primeiro resultado
        const ad = result.data?.find(a => a.id === input.adId) || result.data?.[0];

        if (!ad) {
          return { success: false, error: "Anúncio não encontrado na Meta Ad Library." };
        }

        const validation = validateAdScaling(ad);
        return { success: true, data: validation };
      } catch (error: any) {
        logger.error("[ScalingValidation] validateAd error:", error);
        return { success: false, error: error.message };
      }
    }),

  /**
   * Valida um conjunto de anúncios já carregados (sem nova chamada à API)
   * Recebe os dados dos anúncios diretamente do frontend
   */
  validateAdsBatch: protectedProcedure
    .input(
      z.object({
        ads: z.array(z.any()).min(1, "Pelo menos 1 anúncio é necessário"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const batchResult = validateAdsBatch(input.ads);
        return { success: true, data: batchResult };
      } catch (error: any) {
        logger.error("[ScalingValidation] validateAdsBatch error:", error);
        return { success: false, error: error.message };
      }
    }),

  /**
   * Valida se uma oferta/produto está escalado no mercado
   * Busca anúncios relacionados ao termo e analisa o mercado como um todo
   */
  validateOffer: protectedProcedure
    .input(
      z.object({
        offerName: z.string().min(1, "Nome da oferta é obrigatório"),
        searchTerms: z.string().min(1, "Termos de busca são obrigatórios"),
        countries: z.array(z.string()).default(["BR"]),
        limit: z.number().min(10).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const creds = await getMetaCredentials(ctx.user.id);
      if (!creds || !creds.isValid) {
        return { success: false, error: "Credenciais Meta não configuradas ou inválidas." };
      }

      try {
        logger.info(`[ScalingValidation] Validating offer: "${input.offerName}" with terms: "${input.searchTerms}"`);

        const result = await searchAdsArchive({
          userId: ctx.user.id,
          accessToken: creds.accessToken,
          adReachedCountries: input.countries,
          searchTerms: input.searchTerms,
          adType: "ALL",
          adActiveStatus: "ALL",
          limit: input.limit,
          fields: [
            "id", "page_id", "page_name", "ad_snapshot_url",
            "ad_delivery_start_time", "ad_delivery_stop_time",
            "publisher_platforms", "ad_creative_bodies",
            "ad_creative_link_titles", "ad_creative_link_descriptions",
            "currency", "spend", "impressions", "media_type",
          ],
        });

        if (!result.data || result.data.length === 0) {
          return {
            success: true,
            data: {
              offerId: `offer_${Date.now()}`,
              offerName: input.offerName,
              totalAdsAnalyzed: 0,
              scaledAdsCount: 0,
              averageScore: 0,
              offerScaleLevel: "UNKNOWN",
              isOfferValidated: false,
              competitorCount: 0,
              topCompetitors: [],
              marketSignals: ["Nenhum anúncio encontrado para esta oferta"],
              offerRecommendation: "Sem dados. Tente termos mais amplos ou verifique as credenciais Meta.",
              adValidations: [],
              validatedAt: new Date().toISOString(),
            },
          };
        }

        const offerResult = validateOfferScaling(input.offerName, result.data);
        return { success: true, data: offerResult };
      } catch (error: any) {
        logger.error("[ScalingValidation] validateOffer error:", error);
        return { success: false, error: error.message };
      }
    }),

  /**
   * Busca anúncios escalados e retorna com validação completa
   * Versão enriquecida do searchScaledAds com dados de validação detalhados
   */
  searchAndValidate: protectedProcedure
    .input(
      z.object({
        searchTerms: z.string().optional(),
        countries: z.array(z.string()).default(["BR"]),
        minScore: z.number().min(0).max(100).default(0),
        limit: z.number().min(10).max(100).default(50),
        adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).default("ALL"),
      })
    )
    .query(async ({ ctx, input }) => {
      const creds = await getMetaCredentials(ctx.user.id);
      if (!creds || !creds.isValid) {
        return { success: false, error: "Credenciais Meta não configuradas ou inválidas." };
      }

      try {
        const result = await searchAdsArchive({
          userId: ctx.user.id,
          accessToken: creds.accessToken,
          adReachedCountries: input.countries,
          searchTerms: input.searchTerms || ".",
          adType: "ALL",
          adActiveStatus: input.adActiveStatus,
          limit: input.limit,
          fields: [
            "id", "page_id", "page_name", "ad_snapshot_url",
            "ad_delivery_start_time", "ad_delivery_stop_time",
            "publisher_platforms", "ad_creative_bodies",
            "ad_creative_link_titles", "ad_creative_link_descriptions",
            "currency", "spend", "impressions", "media_type",
          ],
        });

        if (!result.data || result.data.length === 0) {
          return { success: true, data: { ads: [], batch: null } };
        }

        // Enrich each ad with validation data
        const enrichedAds = result.data.map(ad => {
          const validation = validateAdScaling(ad);
          return {
            ...ad,
            scalingScore: validation.scalingScore,
            scalingReasons: validation.signals.filter(s => s.passed).map(s => s.description),
            scaleLevel: validation.scaleLevel,
            isScaled: validation.isScaled,
            confidence: validation.confidence,
            daysActive: validation.rawMetrics.daysActive,
            validation,
          };
        });

        // Filter by minScore and sort
        const filtered = enrichedAds
          .filter(ad => ad.scalingScore >= input.minScore)
          .sort((a, b) => b.scalingScore - a.scalingScore);

        // Batch summary
        const batch = validateAdsBatch(result.data);

        return { success: true, data: { ads: filtered, batch } };
      } catch (error: any) {
        logger.error("[ScalingValidation] searchAndValidate error:", error);
        return { success: false, error: error.message };
      }
    }),
});
