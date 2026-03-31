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
  deleteMetaCredentials,
} from "./metaCredentials";
import { searchAdLibrary, searchScaledAds } from "./metaAdLibrary";
import { getCampaignMetrics, getAdAccountMetrics, listCampaigns } from "./metaMarketing";
import { getDb } from "./db";
import { favoriteAds, monitoredAds, userCampaigns, campaignMetricsHistory } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
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
     * Armazenar e validar credenciais Meta do usuário
     */
    setCredentials: protectedProcedure
      .input(
        z.object({
          accessToken: z.string().min(1, "Access token is required"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        try {
          // Validar token com Meta API
          const validation = await validateMetaToken(input.accessToken);

          if (!validation.valid) {
            return {
              success: false,
              error: validation.error || "Invalid access token",
            };
          }

          // Verificar se tem as permissões necessárias
          const hasAdsRead = validation.permissions.includes("ads_read");
          const hasAdsManagement = validation.permissions.includes("ads_management");

          if (!hasAdsRead && !hasAdsManagement) {
            return {
              success: false,
              error: "Token must have ads_read or ads_management permissions",
            };
          }

          // Armazenar credenciais criptografadas
          await storeMetaCredentials(ctx.user.id, input.accessToken, validation.permissions);

          return {
            success: true,
            permissions: validation.permissions,
          };
        } catch (error) {
          console.error("[Meta] Set credentials error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to set credentials",
          };
        }
      }),

    /**
     * Obter status das credenciais Meta
     */
    getCredentialsStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");

      try {
        const hasValid = await hasValidMetaCredentials(ctx.user.id);
        const creds = hasValid ? await getMetaCredentials(ctx.user.id) : null;

        return {
          hasCredentials: hasValid,
          isValid: hasValid,
          permissions: creds?.permissions || [],
        };
      } catch (error) {
        console.error("[Meta] Get credentials status error:", error);
        return {
          hasCredentials: false,
          isValid: false,
          permissions: [],
        };
      }
    }),

    /**
     * Buscar anúncios competitivos na Ad Library
     */
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
            return {
              success: false,
              error: "Meta credentials not configured or invalid",
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

          return {
            success: true,
            ads: result.ads,
            paging: result.paging,
          };
        } catch (error) {
          console.error("[Meta] Search ads error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to search ads",
            ads: [],
          };
        }
      }),

    /**
     * Buscar anúncios escalados (alto gasto)
     */
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
            return {
              success: false,
              error: "Meta credentials not configured or invalid",
              ads: [],
            };
          }

          const ads = await searchScaledAds(creds.accessToken, input.countries, input.minSpend);

          return {
            success: true,
            ads,
          };
        } catch (error) {
          console.error("[Meta] Search scaled ads error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to search scaled ads",
            ads: [],
          };
        }
      }),

    /**
     * Obter métricas de uma campanha
     */
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
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured or invalid",
              metrics: null,
            };
          }

          const metrics = await getCampaignMetrics(
            creds.accessToken,
            input.campaignId,
            input.dateStart,
            input.dateStop
          );

          return {
            success: true,
            metrics,
          };
        } catch (error) {
          console.error("[Meta] Get campaign metrics error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get campaign metrics",
            metrics: null,
          };
        }
      }),

    /**
     * Obter métricas de uma conta de anúncios
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
          const creds = await getMetaCredentials(ctx.user.id);
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured or invalid",
              metrics: null,
            };
          }

          const metrics = await getAdAccountMetrics(
            creds.accessToken,
            input.adAccountId,
            input.dateStart,
            input.dateStop
          );

          return {
            success: true,
            metrics,
          };
        } catch (error) {
          console.error("[Meta] Get ad account metrics error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get ad account metrics",
            metrics: null,
          };
        }
      }),

    /**
     * Listar campanhas de uma conta
     */
    listCampaigns: protectedProcedure
      .input(
        z.object({
          adAccountId: z.string().min(1),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        try {
          const creds = await getMetaCredentials(ctx.user.id);
          if (!creds || !creds.isValid) {
            return {
              success: false,
              error: "Meta credentials not configured or invalid",
              campaigns: [],
            };
          }

          const campaigns = await listCampaigns(creds.accessToken, input.adAccountId);

          return {
            success: true,
            campaigns,
          };
        } catch (error) {
          console.error("[Meta] List campaigns error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to list campaigns",
            campaigns: [],
          };
        }
      }),

    /**
     * Invalidar credenciais Meta
     */
    invalidateCredentials: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");

      try {
        await invalidateMetaCredentials(ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("[Meta] Invalidate credentials error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to invalidate credentials",
        };
      }
    }),

    /**
     * Remover credenciais Meta
     */
    deleteCredentials: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");

      try {
        await deleteMetaCredentials(ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("[Meta] Delete credentials error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete credentials",
        };
      }
    }),
  }),

  ads: router({
    /**
     * Adicionar anúncio aos favoritos
     */
    addFavorite: protectedProcedure
      .input(
        z.object({
          adId: z.string().min(1),
          pageId: z.string().min(1),
          pageName: z.string().optional(),
          adBody: z.string().optional(),
          adSnapshotUrl: z.string().optional(),
          spend: z.number().optional(),
          impressions: z.number().optional(),
          currency: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          await db.insert(favoriteAds).values({
            userId: ctx.user.id,
            adId: input.adId,
            pageId: input.pageId,
            pageName: input.pageName,
            adBody: input.adBody,
            adSnapshotUrl: input.adSnapshotUrl,
            spend: input.spend ? String(input.spend) : undefined,
            impressions: input.impressions,
            currency: input.currency,
          });

          return { success: true };
        } catch (error) {
          console.error("[Ads] Add favorite error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add favorite",
          };
        }
      }),

    /**
     * Obter favoritos do usuário
     */
    getFavorites: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const favs = await db
          .select()
          .from(favoriteAds)
          .where(eq(favoriteAds.userId, ctx.user.id));

        return { success: true, favorites: favs };
      } catch (error) {
        console.error("[Ads] Get favorites error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get favorites",
          favorites: [],
        };
      }
    }),

    /**
     * Remover favorito
     */
    removeFavorite: protectedProcedure
      .input(z.object({ favoriteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          await db
            .delete(favoriteAds)
            .where(
              and(
                eq(favoriteAds.id, input.favoriteId),
                eq(favoriteAds.userId, ctx.user.id)
              )
            );

          return { success: true };
        } catch (error) {
          console.error("[Ads] Remove favorite error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to remove favorite",
          };
        }
      }),
  }),

  monitoring: router({
    /**
     * Adicionar anúncio ao monitoramento
     */
    addMonitored: protectedProcedure
      .input(
        z.object({
          adId: z.string().min(1),
          pageId: z.string().min(1),
          pageName: z.string().optional(),
          alertConfig: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          await db.insert(monitoredAds).values({
            userId: ctx.user.id,
            adId: input.adId,
            pageId: input.pageId,
            pageName: input.pageName,
            monitoringStatus: "active",
            isStillActive: true,
          });

          return { success: true };
        } catch (error) {
          console.error("[Monitoring] Add monitored error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add monitored ad",
          };
        }
      }),

    /**
     * Obter anúncios monitorados
     */
    getMonitored: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const monitored = await db
          .select()
          .from(monitoredAds)
          .where(eq(monitoredAds.userId, ctx.user.id));

        return { success: true, monitored };
      } catch (error) {
        console.error("[Monitoring] Get monitored error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get monitored ads",
          monitored: [],
        };
      }
    }),

    /**
     * Remover monitoramento
     */
    removeMonitored: protectedProcedure
      .input(z.object({ monitoredId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          await db
            .delete(monitoredAds)
            .where(
              and(
                eq(monitoredAds.id, input.monitoredId),
                eq(monitoredAds.userId, ctx.user.id)
              )
            );

          return { success: true };
        } catch (error) {
          console.error("[Monitoring] Remove monitored error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to remove monitored ad",
          };
        }
      }),
  }),

  campaigns: router({
    /**
     * Obter campanhas do usuário
     */
    getCampaigns: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const campaigns = await db
          .select()
          .from(userCampaigns)
          .where(eq(userCampaigns.userId, ctx.user.id));

        return { success: true, campaigns };
      } catch (error) {
        console.error("[Campaigns] Get campaigns error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get campaigns",
          campaigns: [],
        };
      }
    }),

    /**
     * Obter histórico de métricas de uma campanha
     */
    getMetricsHistory: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          const history = await db
            .select()
            .from(campaignMetricsHistory)
            .where(eq(campaignMetricsHistory.campaignId, input.campaignId));

          return { success: true, history };
        } catch (error) {
          console.error("[Campaigns] Get metrics history error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get metrics history",
            history: [],
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
