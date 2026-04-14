import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getMetaCredentials,
  META_TOKEN_MISSING_ERROR,
  requireMetaCredentials,
} from "./metaCredentials";
import { sdk } from "./_core/sdk";
import { adsRouter } from "./adsRouter";
import { credentialsRouter } from "./credentialsRouter";
import { searchAdLibrary } from "./metaAdLibrary";
import { logger } from "./_core/logger";

export const appRouter = router({
  system: systemRouter,
  credentials: credentialsRouter,
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

    /**
     * Busca de anúncios na Meta Ad Library — Minerador
     * Suporta todos os filtros disponíveis na API da Meta.
     */
    searchAds: protectedProcedure
      .input(
        z.object({
          searchTerms: z.string().optional(),
          searchPageIds: z.array(z.string()).optional(),
          countries: z.array(z.string()).min(1).default(["BR"]),
          adType: z
            .enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "CREDIT_ADS", "EMPLOYMENT_ADS", "HOUSING_ADS"])
            .default("ALL"),
          adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).default("ALL"),
          adDeliveryDateMin: z.string().optional(),
          adDeliveryDateMax: z.string().optional(),
          mediaType: z.enum(["ALL", "IMAGE", "VIDEO", "MEME", "NONE"]).optional(),
          publisherPlatforms: z
            .array(z.enum(["FACEBOOK", "INSTAGRAM", "AUDIENCE_NETWORK", "MESSENGER", "WHATSAPP"]))
            .optional(),
          limit: z.number().min(1).max(500).default(50),
          after: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          const creds = await requireMetaCredentials(ctx.user.id);
          const result = await searchAdLibrary(creds.accessToken, {
            userId: ctx.user.id,
            searchTerms: input.searchTerms,
            searchPageIds: input.searchPageIds,
            countries: input.countries,
            adType: input.adType,
            adActiveStatus: input.adActiveStatus,
            adDeliveryDateMin: input.adDeliveryDateMin,
            adDeliveryDateMax: input.adDeliveryDateMax,
            mediaType: input.mediaType === "ALL" ? undefined : input.mediaType,
            publisherPlatforms: input.publisherPlatforms,
            limit: input.limit,
            after: input.after,
          });
          return { success: true, data: result.ads, paging: result.paging };
        } catch (error: any) {
          logger.error("[Meta] searchAds error:", error);
          return { success: false, error: error?.message || META_TOKEN_MISSING_ERROR, data: [], paging: null };
        }
      }),

    /**
     * Busca de anúncios na página Escalados — com filtro de palavra.
     * Sem nenhum algoritmo de score: retorna os anúncios diretamente da API.
     */
    getEscaladosAds: protectedProcedure
      .input(
        z.object({
          searchTerms: z.string().optional(),
          countries: z.array(z.string()).min(1).default(["BR"]),
          adActiveStatus: z.enum(["ACTIVE", "INACTIVE", "ALL"]).default("ACTIVE"),
          adDeliveryDateMin: z.string().optional(),
          mediaType: z.enum(["ALL", "IMAGE", "VIDEO", "MEME", "NONE"]).optional(),
          publisherPlatforms: z
            .array(z.enum(["FACEBOOK", "INSTAGRAM", "AUDIENCE_NETWORK", "MESSENGER", "WHATSAPP"]))
            .optional(),
          limit: z.number().min(1).max(500).default(50),
          after: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          const creds = await requireMetaCredentials(ctx.user.id);
          const result = await searchAdLibrary(creds.accessToken, {
            userId: ctx.user.id,
            searchTerms: input.searchTerms || ".",
            countries: input.countries,
            adActiveStatus: input.adActiveStatus,
            adDeliveryDateMin: input.adDeliveryDateMin,
            mediaType: input.mediaType === "ALL" ? undefined : input.mediaType,
            publisherPlatforms: input.publisherPlatforms,
            limit: input.limit,
            after: input.after,
          });
          return { success: true, data: result.ads, paging: result.paging };
        } catch (error: any) {
          logger.error("[Meta] getEscaladosAds error:", error);
          return { success: false, error: error?.message || META_TOKEN_MISSING_ERROR, data: [], paging: null };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
