import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getMetaCredentials,
} from "./metaCredentials";
import { sdk } from "./_core/sdk";
import { adsRouter } from "./adsRouter";
import { searchScaledAds as searchScaledAdsLibrary } from "./metaAdLibrary";
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

  meta: router({
    getCredentialsStatus: protectedProcedure.query(async ({ ctx }) => {
      try {
        const credentials = await getMetaCredentials(ctx.user.id);
        return {
          hasCredentials: !!credentials,
          isValid: credentials?.isValid ?? false,
          permissions: credentials?.permissions ?? [],
        };
      } catch (error) {
        logger.error("[Meta] getCredentialsStatus error:", error);
        return { hasCredentials: false, isValid: false, permissions: [] };
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
          mediaType: z.string().optional(),
          publisherPlatforms: z.array(z.string()).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid) {
          return { success: false, error: "Meta Access Token não configurado no servidor." };
        }
        try {
          const ads = await searchScaledAdsLibrary(
            ctx.user.id,
            creds.accessToken,
            input.countries,
            {
              searchTerms: input.keywords,
              adActiveStatus: input.adActiveStatus,
              limit: input.limit,
              mediaType: input.mediaType,
              publisherPlatforms: input.publisherPlatforms,
            }
          );
          return { success: true, data: ads };
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
          return { success: false, error: "Meta Access Token não configurado no servidor." };
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
          return { success: true, data: ads.filter(ad => (ad.scalingScore || 0) >= 30) };
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
          return { success: false, error: "Meta Access Token não configurado no servidor." };
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
          logger.error("[Meta] searchScaledAds error:", error);
          return { success: false, error: error.message };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
