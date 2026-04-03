import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { favoriteAds, userMetaCredentials } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { searchAdsByKeywords, searchAdsByPages } from "./services/metaAdsService";

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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const credentials = await db
          .select()
          .from(userMetaCredentials)
          .where(eq(userMetaCredentials.userId, ctx.user.id));

        if (!credentials.length || !credentials[0].encryptedAccessToken) {
          throw new Error("Meta API credentials not configured. Please add your access token in settings.");
        }

        const accessToken = credentials[0].encryptedAccessToken;

        const result = await searchAdsByKeywords(accessToken, input.keywords, input.countries, {
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
          error: error instanceof Error ? error.message : "Failed to search ads",
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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const credentials = await db
          .select()
          .from(userMetaCredentials)
          .where(eq(userMetaCredentials.userId, ctx.user.id));

        if (!credentials.length || !credentials[0].encryptedAccessToken) {
          throw new Error("Meta API credentials not configured. Please add your access token in settings.");
        }

        const accessToken = credentials[0].encryptedAccessToken;

        const result = await searchAdsByPages(accessToken, input.pageIds, input.countries, {
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
          error: error instanceof Error ? error.message : "Failed to search ads",
          data: [],
        };
      }
    }),
});
