import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  storeMetaCredentials,
  getMetaCredentials,
  deleteMetaCredentials,
  validateMetaToken,
} from "./metaCredentials";
import { sdk } from "./_core/sdk";
import { adsRouter } from "./adsRouter";
import { monitoringRouter } from "./monitoringRouter";
import { campaignsRouter } from "./campaignsRouter";
import { searchAdsArchive } from "./services/metaAdsService";
import { searchScaledAds as searchScaledAdsLibrary } from "./metaAdLibrary";
import { getCampaignMetrics, getAdAccountMetrics, listCampaigns } from "./metaMarketing";
import { logger } from "./_core/logger";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name is too short"),
          email: z.string().email("Invalid email"),
          password: z.string().min(6, "Password must be at least 6 characters"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const user = await sdk.register(input.name, input.email, input.password);
          const sessionToken = await sdk.createSessionToken(user);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
          return { success: true, user };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Registration failed");
        }
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Invalid email"),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const user = await sdk.login(input.email, input.password);
          const sessionToken = await sdk.createSessionToken(user);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
          return { success: true, user };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Login failed");
        }
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  ads: adsRouter,
  monitoring: monitoringRouter,
  campaigns: campaignsRouter,

  meta: router({
    setCredentials: protectedProcedure
      .input(
        z.object({
          accessToken: z.string().min(1, "Access token is required"),
          adAccountId: z.string().optional(),
          accountName: z.string().optional(),
          metaAppId: z.string().optional(),
          metaAppSecret: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const tokenValidation = await validateMetaToken(input.accessToken);
          if (!tokenValidation.valid) {
            return { success: false, error: tokenValidation.error || "Invalid access token" };
          }

          await storeMetaCredentials(ctx.user.id, {
            accessToken: input.accessToken,
            adAccountId: input.adAccountId,
            accountName: input.accountName,
            metaAppId: input.metaAppId,
            metaAppSecret: input.metaAppSecret,
            permissions: tokenValidation.permissions,
          });

          return { success: true, permissions: tokenValidation.permissions };
        } catch (error) {
          logger.error("[Meta] setCredentials error:", error);
          return { success: false, error: error instanceof Error ? error.message : "Failed to set credentials" };
        }
      }),

    getCredentialsStatus: protectedProcedure.query(async ({ ctx }) => {
      try {
        const credentials = await getMetaCredentials(ctx.user.id);
        return {
          hasCredentials: !!credentials,
          isValid: credentials?.isValid ?? false,
          accountName: credentials?.accountName,
          permissions: credentials?.permissions ?? [],
        };
      } catch (error) {
        logger.error("[Meta] getCredentialsStatus error:", error);
        return { hasCredentials: false, isValid: false, permissions: [] };
      }
    }),

    deleteCredentials: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        await deleteMetaCredentials(ctx.user.id);
        return { success: true };
      } catch (error) {
        logger.error("[Meta] deleteCredentials error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete credentials" };
      }
    }),

    // Unified Search Procedure for Advanced Search
    searchByKeywords: protectedProcedure
      .input(
        z.object({
          keywords: z.string().min(1),
          countries: z.array(z.string()).default(["BR"]),
          adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS", "HOUSING_ADS"]).default("ALL"),
          adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).default("ACTIVE"),
          limit: z.number().max(100).default(50),
          after: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid) {
          return { success: false, error: "Meta credentials not configured or invalid." };
        }

        try {
          const result = await searchAdsArchive({
            userId: ctx.user.id,
            accessToken: creds.accessToken,
            adReachedCountries: input.countries,
            searchTerms: input.keywords,
            adType: input.adType,
            adActiveStatus: input.adActiveStatus,
            limit: input.limit,
            after: input.after,
          });

          return { success: true, data: result.data, paging: result.paging };
        } catch (error: any) {
          logger.error("[Meta] searchByKeywords error:", error);
          return { success: false, error: error.message };
        }
      }),

    // Top Scaled Ads for Escalados page (daily champions)
    getTopScaledAds: protectedProcedure
      .input(
        z.object({
          countries: z.array(z.string()).default(["BR"]),
          searchTerms: z.string().optional(),
          adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).default("ALL"),
          adDeliveryDateMin: z.string().optional(),
          limit: z.number().max(100).default(50),
          mediaType: z.string().optional(),
          publisherPlatforms: z.array(z.string()).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid) {
          return { success: false, error: "Meta credentials not configured." };
        }

        try {
          const ads = await searchScaledAdsLibrary(
            ctx.user.id,
            creds.accessToken,
            input.countries,
            {
              searchTerms: input.searchTerms,
              adActiveStatus: input.adActiveStatus,
              adDeliveryDateMin: input.adDeliveryDateMin,
              limit: input.limit,
              mediaType: input.mediaType,
              publisherPlatforms: input.publisherPlatforms,
            }
          );
          return { success: true, data: ads };
        } catch (error: any) {
          logger.error("[Meta] getTopScaledAds error:", error);
          return { success: false, error: error.message };
        }
      }),

    // Optimized Scaled Ads Search for Dashboard
    searchScaledAds: protectedProcedure
      .input(
        z.object({
          countries: z.array(z.string()).default(["BR"]),
          searchTerms: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid) {
          return { success: false, error: "Meta credentials not configured." };
        }

        try {
          const ads = await searchScaledAdsLibrary(
            ctx.user.id,
            creds.accessToken,
            input.countries,
            { searchTerms: input.searchTerms }
          );
          return { success: true, data: ads };
        } catch (error: any) {
          logger.error("[Meta] searchScaledAds error:", error);
          return { success: false, error: error.message };
        }
      }),

    listCampaigns: protectedProcedure.query(async ({ ctx }) => {
      const creds = await getMetaCredentials(ctx.user.id);
      if (!creds || !creds.isValid || !creds.adAccountId) return { campaigns: [] };
      
      const campaigns = await listCampaigns(ctx.user.id, creds.accessToken, creds.adAccountId);
      return { campaigns };
    }),

    getCampaignMetrics: protectedProcedure
      .input(z.object({ 
        campaignId: z.string(),
        dateStart: z.string(),
        dateStop: z.string()
      }))
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid) throw new Error("Meta credentials not configured");
        
        const metrics = await getCampaignMetrics(
          ctx.user.id, 
          creds.accessToken, 
          input.campaignId, 
          input.dateStart, 
          input.dateStop
        );
        return { metrics };
      }),

    getAccountMetrics: protectedProcedure
      .input(z.object({ 
        dateStart: z.string(),
        dateStop: z.string()
      }))
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid || !creds.adAccountId) throw new Error("Meta credentials not configured");
        
        const metrics = await getAdAccountMetrics(
          ctx.user.id, 
          creds.accessToken, 
          creds.adAccountId, 
          input.dateStart, 
          input.dateStop
        );
        return { metrics };
      }),
  }),
});

export type AppRouter = typeof appRouter;
