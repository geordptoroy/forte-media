import { z } from "zod";
import { protectedProcedure, router, RATE_LIMIT_PRESETS } from "./_core/trpc";
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
import { handleError, withErrorHandling, validateInput } from "./_core/error-handler";
import { appCache } from "./_core/cache";
import { TRPCError } from "@trpc/server";

/**
 * Schemas de validação reutilizáveis
 */
const AdInputSchema = z.object({
  adId: z.string().min(1),
  pageId: z.string().min(1),
  pageName: z.string().optional(),
  adSnapshotUrl: z.string().url().optional(),
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
});

/**
 * Ads Router - Refactored for Meta ads_archive API
 * Handles favorite ads management and Meta API integration
 */

export const adsRouter = router({
  /**
   * Get all favorite ads for the authenticated user
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    return withErrorHandling(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Tentar obter do cache primeiro
      const cacheKey = `favorites:${ctx.user.id}`;
      const cached = appCache.get(cacheKey);
      if (cached) return { success: true, favorites: cached };

      const favorites = await db
        .select()
        .from(favoriteAds)
        .where(eq(favoriteAds.userId, ctx.user.id));

      // Cachear por 5 minutos
      appCache.set(cacheKey, favorites, 5 * 60 * 1000);

      return { success: true, favorites };
    }, "getFavorites");
  }),

  /**
   * Add an ad to favorites
   */
  addFavorite: protectedProcedure
    .input(AdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
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

        // Invalidar cache
        appCache.invalidate(`favorites:${ctx.user.id}`);

        return { success: true, message: "Ad added to favorites" };
      }, "addFavorite");
    }),

  /**
   * Toggle an ad in favorites (add if not exists, remove if exists)
   */
  toggleFavorite: protectedProcedure
    .input(AdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if already favorited
        const existing = await db
          .select()
          .from(favoriteAds)
          .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));

        let action: "removed" | "added";

        if (existing.length > 0) {
          // Remove if exists
          await db
            .delete(favoriteAds)
            .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));
          action = "removed";
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
          action = "added";
        }

        // Invalidar cache
        appCache.invalidate(`favorites:${ctx.user.id}`);

        return {
          success: true,
          action,
          message: action === "removed" ? "Removido dos favoritos" : "Adicionado aos favoritos",
        };
      }, "toggleFavorite");
    }),

  /**
   * Remove an ad from favorites
   */
  removeFavorite: protectedProcedure
    .input(z.object({ adId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .delete(favoriteAds)
          .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));

        // Invalidar cache
        appCache.invalidate(`favorites:${ctx.user.id}`);

        return { success: true };
      }, "removeFavorite");
    }),

  /**
   * Search ads from Meta API by keywords com rate limiting
   */
  searchByKeywords: protectedProcedure
    .input(
      z.object({
        keywords: z.string().min(1).max(500),
        countries: z.array(z.string()).default(["BR"]),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS", "HOUSING_ADS"]).optional(),
        adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        // Rate limiting específico para busca
        const key = `search:${ctx.user.id}`;
        if (!ctx.rateLimiter.isAllowed(key, RATE_LIMIT_PRESETS.SEARCH.maxRequests, RATE_LIMIT_PRESETS.SEARCH.windowMs)) {
          const info = ctx.rateLimiter.getInfo(key, RATE_LIMIT_PRESETS.SEARCH.maxRequests, RATE_LIMIT_PRESETS.SEARCH.windowMs);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Rate limit exceeded. Retry after ${info.retryAfter} seconds`,
          });
        }

        const credentials = await getMetaCredentials(ctx.user.id);

        if (!credentials?.accessToken) {
          throw new Error("Meta API Access Token não configurado no servidor.");
        }

        const result = await searchAdsByKeywords(ctx.user.id, credentials.accessToken, input.keywords, input.countries, {
          adType: input.adType,
          adActiveStatus: input.adActiveStatus,
          limit: input.limit,
          after: input.after,
        });

        // Log da mineração
        const db = await getDb();
        if (db) {
          await db.insert(adMiningLog).values({
            userId: ctx.user.id,
            searchTerms: input.keywords,
            countriesFilter: input.countries,
            resultsCount: result.data?.length || 0,
          });
        }

        return { success: true, ...result };
      }, "searchByKeywords");
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
        limit: z.number().min(1).max(100).default(50),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        const credentials = await getMetaCredentials(ctx.user.id);

        if (!credentials?.accessToken) {
          throw new Error("Meta API Access Token não configurado no servidor.");
        }

        const result = await searchAdsByPages(ctx.user.id, credentials.accessToken, input.pageIds, input.countries, {
          adType: input.adType,
          adActiveStatus: input.adActiveStatus,
          limit: input.limit,
          after: input.after,
        });

        return { success: true, ...result };
      }, "searchByPages");
    }),

  /**
   * Extract image from Meta Ad Library snapshot URL
   */
  extractThumbnail: protectedProcedure
    .input(z.object({ snapshotUrl: z.string().url("Invalid snapshot URL") }))
    .query(async ({ input }) => {
      return withErrorHandling(async () => {
        const result = await extractImageFromSnapshotCached(input.snapshotUrl);
        return result;
      }, "extractThumbnail");
    }),

  /**
   * Process ad intelligence (scale score, niche detection)
   */
  processAdIntelligence: protectedProcedure
    .input(
      z.object({
        adId: z.string(),
        adData: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const intelligence = await processAdIntelligence(input.adData);

        // Atualizar favoriteAds com inteligência
        await db
          .update(favoriteAds)
          .set({
            scaleScore: intelligence.scaleScore,
            scaleLevelLabel: intelligence.scaleLevelLabel,
            niche: intelligence.niche,
            daysActive: intelligence.daysActive,
            isScaledAd: intelligence.scaleScore >= 70,
          })
          .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));

        return { success: true, intelligence };
      }, "processAdIntelligence");
    }),

  /**
   * Get scaled ads (score >= 70)
   */
  getScaledAds: protectedProcedure
    .input(
      z.object({
        niche: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return withErrorHandling(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const cacheKey = `scaled:${input.niche || "all"}:${input.limit}`;
        const cached = appCache.get(cacheKey);
        if (cached) return { success: true, ads: cached };

        const ads = await getRandomScaledAds(input.niche, input.limit);

        appCache.set(cacheKey, ads, 10 * 60 * 1000); // 10 min

        return { success: true, ads };
      }, "getScaledAds");
    }),

  /**
   * Search ads with advanced filters
   */
  searchWithFilters: protectedProcedure
    .input(
      z.object({
        keywords: z.string().optional(),
        niche: z.string().optional(),
        minScore: z.number().min(0).max(100).default(0),
        maxScore: z.number().min(0).max(100).default(100),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        const results = await searchAdsWithFilters({
          keywords: input.keywords,
          niche: input.niche,
          minScore: input.minScore,
          maxScore: input.maxScore,
          limit: input.limit,
        });

        return { success: true, ads: results };
      }, "searchWithFilters");
    }),

  /**
   * Update scaled ads library
   */
  updateScaledLibrary: protectedProcedure.mutation(async ({ ctx }) => {
    return withErrorHandling(async () => {
      const result = await updateScaledAdsLibrary();
      appCache.invalidatePattern("scaled:.*");
      return { success: true, updated: result };
    }, "updateScaledLibrary");
  }),
});
