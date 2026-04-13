import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { favoriteAds, adMiningLog } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "./_core/logger";
import * as metaAdsService from "./services/metaAdsService";

/**
 * Ads Router — Refatorado para Gestão de Anúncios e Persistência de Dados Reais
 */

export const adsRouter = router({
  /**
   * Busca oficial na Meta Ads Library por keywords
   */
  searchByKeywords: protectedProcedure
    .input(
      z.object({
        keywords: z.string(),
        countries: z.array(z.string()).default(["BR"]),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "HOUSING_ADS", "EMPLOYMENT_ADS", "CREDIT_ADS", "FINANCIAL_PRODUCTS_AND_SERVICES_ADS"]).default("ALL"),
        limit: z.number().min(1).max(100).default(50),
        after: z.string().optional(),
        mediaType: z.enum(["ALL", "IMAGE", "VIDEO", "MEME", "NONE"]).default("ALL"),
        searchType: z.enum(["KEYWORD_UNORDERED", "KEYWORD_EXACT_PHRASE"]).default("KEYWORD_UNORDERED"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        const db = await getDb();
        if (!db) throw new Error("Banco de dados indisponível");
        
        // Buscar credenciais da Meta do usuário
        const credentials = await db.query.userMetaCredentials.findFirst({
          where: (table, { eq }) => eq(table.userId, userId),
        });

        const accessToken = credentials?.encryptedAccessToken || "";

        const result = await metaAdsService.searchAdsByKeywords(
          userId,
          accessToken,
          input.keywords,
          input.countries,
          {
            adType: input.adType,
            limit: input.limit,
            after: input.after,
            mediaType: input.mediaType,
            searchType: input.searchType
          }
        );

        // Log da mineração para histórico
        await db.insert(adMiningLog).values({
          userId,
          searchTerms: input.keywords,
          countriesFilter: input.countries,
          adTypeFilter: input.adType,
          resultsCount: result.data?.length || 0,
        });

        return { success: true, data: result.data, paging: result.paging };
      } catch (error: any) {
        logger.error("[adsRouter] Erro em searchByKeywords", { error: error.message });
        return { success: false, error: error.message || "Erro interno ao buscar anúncios" };
      }
    }),

  /**
   * Favoritar um anúncio capturando todos os metadados ricos (Raio-X)
   */
  toggleFavorite: protectedProcedure
    .input(
      z.object({
        adId: z.string(),
        pageId: z.string(),
        pageName: z.string().optional(),
        adSnapshotUrl: z.string().optional(),
        adData: z.any().optional(), // Payload completo da Meta
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indisponível");
      const userId = ctx.user.id;

      try {
        // Verificar se já é favorito
        const existing = await db.query.favoriteAds.findFirst({
          where: and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, input.adId)),
        });

        if (existing) {
          // Remover dos favoritos
          await db
            .delete(favoriteAds)
            .where(and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, input.adId)));
          
          return { success: true, action: "removed" };
        }

        // Se não enviou adData, busca na Meta antes de salvar
        let ad = input.adData;
        if (!ad) {
          const credentials = await db.query.userMetaCredentials.findFirst({
            where: (table, { eq }) => eq(table.userId, userId),
          });
          const metaResult = await metaAdsService.searchAdsByPages(
            userId,
            credentials?.encryptedAccessToken || "",
            [input.pageId],
            ["BR"],
            { limit: 1 }
          );
          ad = metaResult.data?.find((a: any) => a.id === input.adId) || {};
        }
        
        // Adicionar aos favoritos com metadados completos (Extração Máxima)
        await db.insert(favoriteAds).values({
          userId,
          adId: input.adId,
          pageId: input.pageId,
          pageName: input.pageName || ad.page_name,
          adSnapshotUrl: input.adSnapshotUrl || ad.ad_snapshot_url,
          adDeliveryStartTime: ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : null,
          adDeliveryStopTime: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null,
          publisherPlatforms: ad.publisher_platforms || [],
          adCreativeBodies: ad.ad_creative_bodies || [],
          adCreativeLinkTitles: ad.ad_creative_link_titles || [],
          adCreativeLinkDescriptions: ad.ad_creative_link_descriptions || [],
          adCreativeLinkCaptions: ad.ad_creative_link_captions || [],
          languages: ad.languages || [],
          currency: ad.currency,
          spend: ad.spend,
          impressions: ad.impressions,
          estimatedAudienceSize: ad.estimated_audience_size,
          demographicDistribution: ad.demographic_distribution,
          deliveryByRegion: ad.delivery_by_region,
          ageCountryGenderReachBreakdown: ad.age_country_gender_reach_breakdown,
          targetLocations: ad.target_locations,
          targetAges: ad.target_ages,
          targetGender: ad.target_gender,
          // Novos campos capturados
          cdnImageUrl: ad.ad_snapshot_url, // Fallback para o snapshot
        });

        return { success: true, action: "added" };
      } catch (error: any) {
        logger.error("[Ads] Erro ao alternar favorito:", error);
        throw new Error("Falha ao processar favorito.");
      }
    }),

  /**
   * Listar anúncios favoritos do usuário
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");
    try {
      const favorites = await db.query.favoriteAds.findMany({
        where: eq(favoriteAds.userId, ctx.user.id),
        orderBy: [desc(favoriteAds.createdAt)],
      });
      return { success: true, data: favorites };
    } catch (error: any) {
      logger.error("[Ads] Erro ao listar favoritos:", error);
      return { success: false, error: error.message };
    }
  }),
});
