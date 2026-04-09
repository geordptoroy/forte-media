import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { favoriteAds, scaledAdsLibrary, adMiningLog } from "../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { searchAdsByKeywords, searchAdsByPages } from "./services/metaAdsService";
import { extractImageFromSnapshotCached } from "./services/imageProxyService";
import { getMetaCredentials } from "./metaCredentials";
import {
  processAdIntelligence,
  getRandomScaledAds,
  updateScaledAdsLibrary,
  searchAdsWithFilters,
} from "./services/adIntelligenceService";

/**
 * Ads Router - Refactored for Meta ads_archive API
 * Handles favorite ads management and Meta API integration
 */

export const adsRouter = router({
  /**
   * Get all favorite ads for the authenticated user
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const favorites = await db
        .select()
        .from(favoriteAds)
        .where(eq(favoriteAds.userId, ctx.user.id));

      return { success: true, favorites };
    } catch (error) {
      console.error("[Ads] getFavorites error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get favorites",
        favorites: [],
      };
    }
  }),

  /**
   * Add an ad to favorites
   */
  addFavorite: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1),
        pageId: z.string().min(1),
        pageName: z.string().optional(),
        adSnapshotUrl: z.string().optional(),
        adDeliveryStartTime: z.date().optional(),
        adDeliveryStopTime: z.date().optional(),
        publisherPlatforms: z.array(z.string()).optional(),
        adCreativeBodies: z.array(z.string()).optional(),
        adCreativeLinkTitles: z.array(z.string()).optional(),
        adCreativeLinkDescriptions: z.array(z.string()).optional(),
        currency: z.string().optional(),
        spend: z.any().optional(),
        impressions: z.any().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if already favorited
        const existing = await db
          .select()
          .from(favoriteAds)
          .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));

        if (existing.length > 0) {
          return { success: true, message: "Ad already in favorites", favorite: existing[0] };
        }

        await db.insert(favoriteAds).values({
          userId: ctx.user.id,
          adId: input.adId,
          pageId: input.pageId,
          pageName: input.pageName,
          adSnapshotUrl: input.adSnapshotUrl,
          adDeliveryStartTime: input.adDeliveryStartTime,
          adDeliveryStopTime: input.adDeliveryStopTime,
          publisherPlatforms: input.publisherPlatforms || [],
          adCreativeBodies: input.adCreativeBodies || [],
          adCreativeLinkTitles: input.adCreativeLinkTitles || [],
          adCreativeLinkDescriptions: input.adCreativeLinkDescriptions || [],
          currency: input.currency,
          spend: input.spend,
          impressions: input.impressions,
          notes: input.notes,
        });

        return { success: true, message: "Ad added to favorites" };
      } catch (error) {
        console.error("[Ads] addFavorite error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to add favorite",
        };
      }
    }),

  /**
   * Toggle an ad in favorites (add if not exists, remove if exists)
   */
  toggleFavorite: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1),
        pageId: z.string().min(1),
        pageName: z.string().optional(),
        adSnapshotUrl: z.string().optional(),
        adDeliveryStartTime: z.date().optional(),
        adDeliveryStopTime: z.date().optional(),
        publisherPlatforms: z.array(z.string()).optional(),
        adCreativeBodies: z.array(z.string()).optional(),
        adCreativeLinkTitles: z.array(z.string()).optional(),
        adCreativeLinkDescriptions: z.array(z.string()).optional(),
        currency: z.string().optional(),
        spend: z.any().optional(),
        impressions: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if already favorited
        const existing = await db
          .select()
          .from(favoriteAds)
          .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));

        if (existing.length > 0) {
          // Remove if exists
          await db
            .delete(favoriteAds)
            .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));
          return { success: true, action: "removed", message: "Removido dos favoritos" };
        } else {
          // Add if not exists
          await db.insert(favoriteAds).values({
            userId: ctx.user.id,
            adId: input.adId,
            pageId: input.pageId,
            pageName: input.pageName,
            adSnapshotUrl: input.adSnapshotUrl,
            adDeliveryStartTime: input.adDeliveryStartTime,
            adDeliveryStopTime: input.adDeliveryStopTime,
            publisherPlatforms: input.publisherPlatforms || [],
            adCreativeBodies: input.adCreativeBodies || [],
            adCreativeLinkTitles: input.adCreativeLinkTitles || [],
            adCreativeLinkDescriptions: input.adCreativeLinkDescriptions || [],
            currency: input.currency,
            spend: input.spend,
            impressions: input.impressions,
          });
          return { success: true, action: "added", message: "Adicionado aos favoritos" };
        }
      } catch (error) {
        console.error("[Ads] toggleFavorite error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to toggle favorite",
        };
      }
    }),

  /**
   * Remove an ad from favorites
   */
  removeFavorite: protectedProcedure
    .input(z.object({ adId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .delete(favoriteAds)
          .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));

        return { success: true };
      } catch (error) {
        console.error("[Ads] removeFavorite error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to remove favorite",
        };
      }
    }),

  /**
   * Search ads from Meta API by keywords
   */
  searchByKeywords: protectedProcedure
    .input(
      z.object({
        keywords: z.string().min(1),
        countries: z.array(z.string()).default(["BR"]),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS", "HOUSING_ADS"]).optional(),
        adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).optional(),
        limit: z.number().min(1).max(1000).default(100),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const credentials = await getMetaCredentials(ctx.user.id);

        if (!credentials || !credentials.accessToken) {
          throw new Error("Meta API Access Token não configurado no servidor.");
        }

        const result = await searchAdsByKeywords(ctx.user.id, credentials.accessToken, input.keywords, input.countries, {
          adType: input.adType,
          adActiveStatus: input.adActiveStatus,
          limit: input.limit,
          after: input.after,
        });

        return { success: true, ...result };
      } catch (error) {
        console.error("[Ads] searchByKeywords error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao buscar anúncios",
          data: [],
        };
      }
    }),

  /**
   * Search ads from Meta API by page IDs
   */
  searchByPages: protectedProcedure
    .input(
      z.object({
        pageIds: z.array(z.string()).min(1).max(10),
        countries: z.array(z.string()).default(["BR"]),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS", "HOUSING_ADS"]).optional(),
        adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).optional(),
        limit: z.number().min(1).max(1000).default(100),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const credentials = await getMetaCredentials(ctx.user.id);

        if (!credentials || !credentials.accessToken) {
          throw new Error("Meta API Access Token não configurado no servidor.");
        }

        const result = await searchAdsByPages(ctx.user.id, credentials.accessToken, input.pageIds, input.countries, {
          adType: input.adType,
          adActiveStatus: input.adActiveStatus,
          limit: input.limit,
          after: input.after,
        });

        return { success: true, ...result };
      } catch (error) {
        console.error("[Ads] searchByPages error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao buscar anúncios",
          data: [],
        };
      }
    }),

  /**
   * Extract image from Meta Ad Library snapshot URL
   */
  extractThumbnail: protectedProcedure
    .input(
      z.object({
        snapshotUrl: z.string().url("Invalid snapshot URL"),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await extractImageFromSnapshotCached(input.snapshotUrl);
        return result;
      } catch (error) {
        console.error("[Ads] extractThumbnail error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to extract thumbnail",
        };
      }
    }),

  /**
   * Processa inteligência de um anúncio individual
   * Extrai mídia CDN, detecta nicho e calcula score de escala
   */
  processAdIntelligence: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1),
        snapshotUrl: z.string().url(),
        deliveryStartTime: z.date().optional(),
        publisherPlatforms: z.array(z.string()).default([]),
        creativeBodies: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const credentials = await getMetaCredentials(ctx.user.id);
        const accessToken = credentials?.accessToken || "";

        const result = await processAdIntelligence(
          input.adId,
          input.snapshotUrl,
          input.deliveryStartTime || null,
          input.publisherPlatforms,
          input.creativeBodies,
          accessToken
        );

        // Atualizar o anúncio no banco se for favorito
        const db = await getDb();
        if (db) {
          await db
            .update(favoriteAds)
            .set({
              scaleScore: result.intelligence.scaleScore,
              scaleLevelLabel: result.intelligence.scaleLevelLabel,
              niche: result.intelligence.niche,
              daysActive: result.intelligence.daysActive,
              isScaledAd: result.intelligence.isScaledAd,
              cdnVideoUrl: result.media.videoUrl,
              cdnImageUrl: result.media.imageUrl,
              cdnThumbnailUrl: result.media.thumbnailUrl,
              mediaExtractedAt: new Date(),
            })
            .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));
        }

        return { success: true, ...result };
      } catch (error) {
        console.error("[Ads] processAdIntelligence error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao processar inteligência",
        };
      }
    }),

  /**
   * Obtém anúncios escalados (score >= 70) para a página Escalados
   * Retorna anúncios embaralhados da biblioteca curada
   */
  getScaledAds: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        niche: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Primeiro tentar da biblioteca curada
        const libraryAds = await getRandomScaledAds(input.limit, input.niche);

        // Se não houver anúncios na biblioteca, buscar dos favoritos do usuário
        if (libraryAds.length === 0) {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const userScaledAds = await db
            .select()
            .from(favoriteAds)
            .where(and(eq(favoriteAds.userId, ctx.user.id), gte(favoriteAds.scaleScore, 70)));

          const filtered = input.niche
            ? userScaledAds.filter((ad) => ad.niche === input.niche)
            : userScaledAds;

          const shuffled = filtered.sort(() => Math.random() - 0.5);
          return { success: true, ads: shuffled.slice(0, input.limit) };
        }

        return { success: true, ads: libraryAds };
      } catch (error) {
        console.error("[Ads] getScaledAds error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao buscar anúncios escalados",
          ads: [],
        };
      }
    }),

  /**
   * Busca avançada de anúncios com filtros de score, nicho e keywords
   * Usado pelo Minerador para encontrar anúncios relevantes
   */
  searchWithFilters: protectedProcedure
    .input(
      z.object({
        keywords: z.string().optional(),
        niche: z.string().optional(),
        minScaleScore: z.number().min(0).max(100).default(0),
        maxScaleScore: z.number().min(0).max(100).default(100),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        // Registrar log de mineração
        if (db) {
          await db.insert(adMiningLog).values({
            userId: ctx.user.id,
            searchTerms: input.keywords,
            nicheFilter: input.niche,
            minScaleScore: input.minScaleScore,
            maxScaleScore: input.maxScaleScore,
            resultsCount: 0,
          });
        }

        const ads = await searchAdsWithFilters(ctx.user.id, {
          keywords: input.keywords,
          niche: input.niche,
          minScaleScore: input.minScaleScore,
          maxScaleScore: input.maxScaleScore,
          limit: input.limit,
        });

        return { success: true, ads };
      } catch (error) {
        console.error("[Ads] searchWithFilters error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro na busca com filtros",
          ads: [],
        };
      }
    }),

  /**
   * Atualiza a biblioteca de anúncios escalados manualmente
   * Sincroniza anúncios com score >= 70 para a tabela scaledAdsLibrary
   */
  updateScaledLibrary: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await updateScaledAdsLibrary();
      return { success: true, ...result };
    } catch (error) {
      console.error("[Ads] updateScaledLibrary error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar biblioteca",
      };
    }
  }),
});
