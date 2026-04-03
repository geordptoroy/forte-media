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

  /**
   * Specialized Routers
   */
  ads: adsRouter,
  monitoring: monitoringRouter,
  campaigns: campaignsRouter,

  /**
   * Meta Integration Router
   */
  meta: router({
    /**
     * Store Meta access token and account info
     */
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
          // Validate access token
          const tokenValidation = await validateMetaToken(input.accessToken);
          if (!tokenValidation.valid) {
            return {
              success: false,
              error: tokenValidation.error || "Invalid access token",
            };
          }

          // Store credentials
          await storeMetaCredentials(ctx.user.id, {
            accessToken: input.accessToken,
            adAccountId: input.adAccountId,
            accountName: input.accountName,
            metaAppId: input.metaAppId,
            metaAppSecret: input.metaAppSecret,
            permissions: tokenValidation.permissions,
          });

          return {
            success: true,
            permissions: tokenValidation.permissions,
          };
        } catch (error) {
          console.error("[Meta] setCredentials error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to set credentials",
          };
        }
      }),

    /**
     * Get status of Meta credentials for current user
     */
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
        console.error("[Meta] getCredentialsStatus error:", error);
        return {
          hasCredentials: false,
          isValid: false,
          permissions: [],
        };
      }
    }),

    /**
     * Delete Meta credentials
     */
    deleteCredentials: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        await deleteMetaCredentials(ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("[Meta] deleteCredentials error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete credentials" };
      }
    }),

    /**
     * Search ads in Ad Library (Meta API)
     */
    searchAds: protectedProcedure
      .input(
        z.object({
          searchTerms: z.array(z.string()).min(1),
          countries: z.array(z.string()).min(1),
          limit: z.number().optional(),
          after: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid) {
          throw new Error("Meta credentials not configured");
        }

        const result = await searchAdsArchive({
          accessToken: creds.accessToken,
          adReachedCountries: input.countries,
          searchTerms: input.searchTerms.join(","),
          limit: input.limit,
          after: input.after,
        });

        return { ads: result.data, paging: result.paging };
      }),

    /**
     * Search scaled ads (high spend/performance)
     */
    searchScaledAds: protectedProcedure
      .input(
        z.object({
          countries: z.array(z.string()).min(1),
          minSpend: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const creds = await getMetaCredentials(ctx.user.id);
        if (!creds || !creds.isValid) {
          throw new Error("Meta credentials not configured");
        }

        // Use the same search service but with scaling logic
        const result = await searchAdsArchive({
          accessToken: creds.accessToken,
          adReachedCountries: input.countries,
          searchTerms: "", // Empty search for broad discovery
          limit: 50,
        });

        return { ads: result.data };
      }),

    /**
     * List user campaigns (Marketing API)
     */
    listCampaigns: protectedProcedure.query(async ({ ctx }) => {
      const creds = await getMetaCredentials(ctx.user.id);
      if (!creds || !creds.isValid || !creds.adAccountId) {
        return { campaigns: [] };
      }
      
      // Basic placeholder for Marketing API integration
      return { campaigns: [] };
    }),

    /**
     * Get campaign metrics (Marketing API)
     */
    getCampaignMetrics: protectedProcedure
      .input(z.object({ campaignId: z.string() }))
      .query(async () => {
        return { metrics: [] };
      }),
  }),
});

export type AppRouter = typeof appRouter;
