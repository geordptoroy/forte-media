import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  storeMetaCredentials,
  getMetaCredentials,
  listMetaCredentials,
  hasValidMetaCredentials,
  validateMetaToken,
  validateMetaApp,
  validateAdAccount,
  invalidateMetaCredentials,
  deleteMetaCredentials,
  updateCredentialValidation,
  type MetaCredentialsConfig,
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
    /**
     * Store complete Meta credentials (App ID, App Secret, Access Token, Ad Account)
     */
    setCredentials: protectedProcedure
      .input(
        z.object({
          metaAppId: z.string().min(1, "App ID is required"),
          metaAppSecret: z.string().optional(),
          accessToken: z.string().min(1, "Access token is required"),
          adAccountId: z.string().optional(),
          accountName: z.string().optional(),
          isSystemUser: z.boolean().optional(),
          systemUserId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          // Validate access token
          const tokenValidation = await validateMetaToken(input.accessToken, input.metaAppSecret);
          if (!tokenValidation.valid) {
            return {
              success: false,
              error: tokenValidation.error || "Invalid access token",
            };
          }

          // Validate App ID and Secret if provided
          if (input.metaAppSecret) {
            const appValidation = await validateMetaApp(input.metaAppId, input.metaAppSecret);
            if (!appValidation.valid) {
              return {
                success: false,
                error: appValidation.error || "Invalid App ID or App Secret",
              };
            }
          }

          // Validate Ad Account if provided
          let accountName = input.accountName;
          if (input.adAccountId) {
            const accountValidation = await validateAdAccount(input.accessToken, input.adAccountId);
            if (!accountValidation.valid) {
              return {
                success: false,
                error: accountValidation.error || "Invalid Ad Account ID",
              };
            }
            accountName = accountValidation.accountName || input.accountName;
          }

          // Store credentials
          const config: MetaCredentialsConfig = {
            metaAppId: input.metaAppId,
            metaAppSecret: input.metaAppSecret,
            adAccountId: input.adAccountId,
            accountName,
            accessToken: input.accessToken,
            isSystemUser: input.isSystemUser,
            systemUserId: input.systemUserId,
            permissions: tokenValidation.permissions,
          };

          await storeMetaCredentials(ctx.user.id, config);

          return {
            success: true,
            permissions: tokenValidation.permissions,
            accountName,
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
      if (!ctx.user) throw new Error("User not authenticated");
      try {
        const credentials = await listMetaCredentials(ctx.user.id);
        return {
          hasCredentials: credentials.length > 0,
          credentials: credentials.map((c) => ({
            id: c.id,
            metaAppId: c.metaAppId,
            adAccountId: c.adAccountId,
            accountName: c.accountName,
            isValid: c.isValid,
            permissions: c.permissions,
          })),
        };
      } catch (error) {
        console.error("[Meta] getCredentialsStatus error:", error);
        return {
          hasCredentials: false,
          credentials: [],
        };
      }
    }),

    /**
     * Delete specific Meta credentials
     */
    deleteCredentials: protectedProcedure
      .input(z.object({ credentialId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          await deleteMetaCredentials(ctx.user.id, input.credentialId);
          return { success: true };
        } catch (error) {
          console.error("[Meta] deleteCredentials error:", error);
          return { success: false, error: error instanceof Error ? error.message : "Failed to delete credentials" };
        }
      }),

    /**
     * Search ads in Ad Library
     */
    searchAds: protectedProcedure
      .input(
        z.object({
          searchTerms: z.array(z.string()).min(1),
          countries: z.array(z.string()).min(1),
          adAccountId: z.string().optional(),
          adType: z.enum(["POLITICAL", "ISSUE_ADS", "ALL"]).optional(),
          limit: z.number().min(1).max(100).optional(),
          after: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id, undefined, input.adAccountId);
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured for this account",
              ads: [],
            };
          }

          const result = await searchAdLibrary(creds.accessToken, {
            searchTerms: input.searchTerms,
            countries: input.countries,
            adType: input.adType,
            limit: input.limit,
            after: input.after,
          });

          return { success: true, ads: result.ads, paging: result.paging };
        } catch (error) {
          console.error("[Meta] searchAds error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Search failed",
            ads: [],
          };
        }
      }),

    /**
     * Search scaled ads (high-performing ads)
     */
    searchScaledAds: protectedProcedure
      .input(
        z.object({
          countries: z.array(z.string()).min(1),
          adAccountId: z.string().optional(),
          minSpend: z.number().optional(),
          minCTR: z.number().optional(),
          minROAS: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id, undefined, input.adAccountId);
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured for this account",
              ads: [],
            };
          }

          const ads = await searchScaledAds(creds.accessToken, input.countries, {
            minSpend: input.minSpend,
            minCTR: input.minCTR,
            minROAS: input.minROAS,
          });

          return { success: true, ads };
        } catch (error) {
          console.error("[Meta] searchScaledAds error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Search failed",
            ads: [],
          };
        }
      }),

    /**
     * Get campaign metrics
     */
    getCampaignMetrics: protectedProcedure
      .input(
        z.object({
          campaignId: z.string().min(1),
          adAccountId: z.string().optional(),
          dateStart: z.string(),
          dateStop: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id, undefined, input.adAccountId);
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured",
              metrics: null,
            };
          }

          const metrics = await getCampaignMetrics(
            creds.accessToken,
            input.campaignId,
            input.dateStart,
            input.dateStop
          );

          return { success: true, metrics };
        } catch (error) {
          console.error("[Meta] getCampaignMetrics error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get metrics",
            metrics: null,
          };
        }
      }),

    /**
     * Get ad account metrics
     */
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
          const creds = await getMetaCredentials(ctx.user.id, undefined, input.adAccountId);
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured",
              metrics: null,
            };
          }

          const metrics = await getAdAccountMetrics(
            creds.accessToken,
            input.adAccountId,
            input.dateStart,
            input.dateStop
          );

          return { success: true, metrics };
        } catch (error) {
          console.error("[Meta] getAdAccountMetrics error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get metrics",
            metrics: null,
          };
        }
      }),

    /**
     * List campaigns for an ad account
     */
    listCampaigns: protectedProcedure
      .input(z.object({ adAccountId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          const creds = await getMetaCredentials(ctx.user.id, undefined, input.adAccountId);
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured",
              campaigns: [],
            };
          }

          const campaigns = await listCampaigns(creds.accessToken, input.adAccountId);
          return { success: true, campaigns };
        } catch (error) {
          console.error("[Meta] listCampaigns error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to list campaigns",
            campaigns: [],
          };
        }
      }),

    /**
     * Invalidate Meta credentials
     */
    invalidateCredentials: protectedProcedure
      .input(z.object({ credentialId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        try {
          await invalidateMetaCredentials(ctx.user.id);
          return { success: true };
        } catch (error) {
          console.error("[Meta] invalidateCredentials error:", error);
          return { success: false };
        }
      }),
  }),
});
