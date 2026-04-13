import { z } from "zod";
import { protectedProcedure, router, RATE_LIMIT_PRESETS } from "./_core/trpc";
import { getDb } from "./db";
import { favoriteAds, adMiningLog } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { searchAdsByKeywords, searchAdsByPages } from "./services/metaAdsService";
import { extractImageFromSnapshotCached } from "./services/imageProxyService";
import { getMetaCredentials } from "./metaCredentials";
import { handleError, withErrorHandling } from "./_core/error-handler";
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
 * Ads Router - Simplified for Meta Ads Library integration
 */
export const adsRouter = router({
  /**
   * Get all favorite ads for the authenticated user
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    return withErrorHandling(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const cacheKey = `favorites:${ctx.user.id}`;
      const cached = appCache.get(cacheKey);
      if (cached) return { success: true, favorites: cached };

      const favorites = await db
        .select()
        .from(favoriteAds)
        .where(eq(favoriteAds.userId, ctx.user.id));

      appCache.set(cacheKey, favorites, 5 * 60 * 1000);
      return { success: true, favorites };
    }, "getFavorites");
  }),

  /**
   * Toggle an ad in favorites
   */
  toggleFavorite: protectedProcedure
    .input(AdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const existing = await db
          .select()
          .from(favoriteAds)
          .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));

        let action: "removed" | "added";

        if (existing.length > 0) {
          await db
            .delete(favoriteAds)
            .where(and(eq(favoriteAds.userId, ctx.user.id), eq(favoriteAds.adId, input.adId)));
          action = "removed";
        } else {
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

        appCache.invalidate(`favorites:${ctx.user.id}`);
        return {
          success: true,
          action,
          message: action === "removed" ? "Removido dos favoritos" : "Adicionado aos favoritos",
        };
      }, "toggleFavorite");
    }),

  /**
   * Search ads from Meta API by keywords (Minerador)
   */
  searchByKeywords: protectedProcedure
    .input(
      z.object({
        keywords: z.string().min(1).max(500),
        countries: z.array(z.string()).default(["BR"]),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS", "HOUSING_ADS"]).default("ALL"),
        limit: z.number().min(1).max(100).default(50),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
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
          throw new Error("Meta API Access Token não configurado.");
        }

        const result = await searchAdsByKeywords(ctx.user.id, credentials.accessToken, input.keywords, input.countries, {
          adType: input.adType,
          adActiveStatus: "ACTIVE",
          limit: input.limit,
          after: input.after,
        });

        const db = await getDb();
        if (db) {
          await db.insert(adMiningLog).values({
            userId: ctx.user.id,
            searchTerms: input.keywords,
            countriesFilter: input.countries,
            adTypeFilter: input.adType,
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
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS", "HOUSING_ADS"]).default("ALL"),
        limit: z.number().min(1).max(100).default(50),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return withErrorHandling(async () => {
        const credentials = await getMetaCredentials(ctx.user.id);
        if (!credentials?.accessToken) {
          throw new Error("Meta API Access Token não configurado.");
        }

        const result = await searchAdsByPages(ctx.user.id, credentials.accessToken, input.pageIds, input.countries, {
          adType: input.adType,
          adActiveStatus: "ACTIVE",
          limit: input.limit,
          after: input.after,
        });

        return { success: true, ...result };
      }, "searchByPages");
    }),

  /**
   * Extract thumbnail
   */
  extractThumbnail: protectedProcedure
    .input(z.object({ snapshotUrl: z.string().url() }))
    .query(async ({ input }) => {
      return withErrorHandling(async () => {
        return await extractImageFromSnapshotCached(input.snapshotUrl);
      }, "extractThumbnail");
    }),
});
