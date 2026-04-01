import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  storeMetaCredentials,
  getMetaCredentials,
  hasValidMetaCredentials,
  validateMetaToken,
  invalidateMetaCredentials,
} from "./metaCredentials";
import { searchAdLibrary, searchScaledAds } from "./metaAdLibrary";
import { getCampaignMetrics, getAdAccountMetrics, listCampaigns } from "./metaMarketing";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    /**
     * Get current user info from session
     */
    me: publicProcedure.query((opts) => opts.ctx.user),

    /**
     * Register a new user locally
     */
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

    /**
     * Login user locally
     */
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

    /**
     * Logout user
     */
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  meta: router({
    setCredentials: protectedProcedure
      .input(
        z.object({
          accessToken: z.string().min(1, "Access token is required"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const validation = await validateMetaToken(input.accessToken);
          if (!validation.valid) {
            return { success: false, error: validation.error || "Invalid access token" };
          }
          await storeMetaCredentials(ctx.user.id, input.accessToken, validation.permissions);
          return { success: true, permissions: validation.permissions };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Failed to set credentials" };
        }
      }),

    getCredentialsStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      try {
        const hasValid = await hasValidMetaCredentials(ctx.user.id);
        const creds = hasValid ? await getMetaCredentials(ctx.user.id) : null;
        return { hasCredentials: hasValid, isValid: hasValid, permissions: creds?.permissions || [] };
      } catch (error) {
        return { hasCredentials: false, isValid: false, permissions: [] };
      }
    }),

    searchAds: protectedProcedure
      .input(
        z.object({
          searchTerms: z.array(z.string()).min(1),
          countries: z.array(z.string()).min(1),
          adType: z.enum(["POLITICAL", "ISSUE_ADS", "ALL"]).optional(),
          limit: z.number().min(1).max(100).optional(),
          after: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id);
          if (!creds || !creds.isValid) {
            return { success: false, error: "Meta credentials not configured", ads: [] };
          }
          const result = await searchAdLibrary(creds.accessToken, input);
          return { success: true, ads: result.ads, paging: result.paging };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Search failed", ads: [] };
        }
      }),

    searchScaledAds: protectedProcedure
      .input(
        z.object({
          countries: z.array(z.string()).min(1),
          minSpend: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id);
          if (!creds || !creds.isValid) {
            return { success: false, error: "Meta credentials not configured", ads: [] };
          }
          const ads = await searchScaledAds(creds.accessToken, input.countries, input.minSpend);
          return { success: true, ads };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Search failed", ads: [] };
        }
      }),

    getCampaignMetrics: protectedProcedure
      .input(
        z.object({
          campaignId: z.string().min(1),
          dateStart: z.string(),
          dateStop: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id);
          if (!creds || !creds.isValid) return { success: false, error: "Meta credentials not configured", metrics: null };
          const metrics = await getCampaignMetrics(creds.accessToken, input.campaignId, input.dateStart, input.dateStop);
          return { success: true, metrics };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Failed to get metrics", metrics: null };
        }
      }),

    getAdAccountMetrics: protectedProcedure
      .input(
        z.object({
          adAccountId: z.string().min(1),
          dateStart: z.string(),
          dateStop: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id);
          if (!creds || !creds.isValid) return { success: false, error: "Meta credentials not configured", metrics: null };
          const metrics = await getAdAccountMetrics(creds.accessToken, input.adAccountId, input.dateStart, input.dateStop);
          return { success: true, metrics };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Failed to get metrics", metrics: null };
        }
      }),

    listCampaigns: protectedProcedure
      .input(z.object({ adAccountId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id);
          if (!creds || !creds.isValid) return { success: false, error: "Meta credentials not configured", campaigns: [] };
          const campaigns = await listCampaigns(creds.accessToken, input.adAccountId);
          return { success: true, campaigns };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Failed to list campaigns", campaigns: [] };
        }
      }),

    invalidateCredentials: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      try {
        await invalidateMetaCredentials(ctx.user.id);
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    }),
  }),
});
