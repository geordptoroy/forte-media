import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as metaAdsService from "./services/metaAdsService";
import { db } from "./db";
import { favoriteAds, adMiningLog } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./_core/logger";

export const adsRouter = router({
  /**
   * Busca oficial na Meta Ads Library por keywords
   */
  searchByKeywords: protectedProcedure
    .input(
      z.object({
        keywords: z.string(),
        countries: z.array(z.string()).default(["BR"]),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS", "HOUSING_ADS", "EMPLOYMENT_ADS", "CREDIT_ADS"]).default("ALL"),
        limit: z.number().min(1).max(100).default(50),
        after: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        
        // Buscar credenciais da Meta do usuário
        const credentials = await db.query.userMetaCredentials.findFirst({
          where: (table, { eq }) => eq(table.userId, userId),
        });

        if (!credentials || !credentials.encryptedAccessToken) {
          return { success: false, error: "Credenciais da Meta não configuradas. Vá em Configurações." };
        }

        // TODO: Descriptografar o token em produção
        const accessToken = credentials.encryptedAccessToken;

        const result = await metaAdsService.searchAdsByKeywords(
          userId,
          accessToken,
          input.keywords,
          input.countries,
          {
            adType: input.adType,
            limit: input.limit,
            after: input.after,
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
   * Favoritar/Desfavoritar anúncio
   */
  toggleFavorite: protectedProcedure
    .input(
      z.object({
        adId: z.string(),
        pageId: z.string(),
        pageName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const { adId, pageId, pageName } = input;

      try {
        const existing = await db.query.favoriteAds.findFirst({
          where: and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, adId)),
        });

        if (existing) {
          await db.delete(favoriteAds).where(and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, adId)));
          return { success: true, action: "removed", message: "Removido dos favoritos" };
        }

        // Buscar detalhes completos do anúncio na Meta para salvar com todos os novos campos
        const credentials = await db.query.userMetaCredentials.findFirst({
          where: (table, { eq }) => eq(table.userId, userId),
        });

        if (!credentials) throw new Error("Credenciais não encontradas");

        const metaResult = await metaAdsService.searchAdsByPages(
          userId,
          credentials.encryptedAccessToken,
          [pageId],
          [], // Sem filtro de país para pegar o específico por ID
          { limit: 1 }
        );

        const adData = metaResult.data?.find((a: any) => a.id === adId);

        if (!adData) {
          // Se não achar na busca por página (raro), salva o que tem
          await db.insert(favoriteAds).values({
            userId,
            adId,
            pageId,
            pageName,
            publisherPlatforms: [],
            adCreativeBodies: [],
            adCreativeLinkTitles: [],
            adCreativeLinkDescriptions: [],
            adCreativeLinkCaptions: [],
            languages: [],
          });
        } else {
          // Salvar com todos os campos ricos retornados pela API
          await db.insert(favoriteAds).values({
            userId,
            adId,
            pageId,
            pageName: adData.page_name || pageName,
            adSnapshotUrl: adData.ad_snapshot_url,
            adDeliveryStartTime: adData.ad_delivery_start_time ? new Date(adData.ad_delivery_start_time) : null,
            adDeliveryStopTime: adData.ad_delivery_stop_time ? new Date(adData.ad_delivery_stop_time) : null,
            publisherPlatforms: adData.publisher_platforms || [],
            adCreativeBodies: adData.ad_creative_bodies || [],
            adCreativeLinkTitles: adData.ad_creative_link_titles || [],
            adCreativeLinkDescriptions: adData.ad_creative_link_descriptions || [],
            adCreativeLinkCaptions: adData.ad_creative_link_captions || [],
            languages: adData.languages || [],
            currency: adData.currency,
            spend: adData.spend,
            impressions: adData.impressions,
            estimatedAudienceSize: adData.estimated_audience_size,
            demographicDistribution: adData.demographic_distribution,
            deliveryByRegion: adData.delivery_by_region,
            ageCountryGenderReachBreakdown: adData.age_country_gender_reach_breakdown,
            targetLocations: adData.target_locations,
            targetAges: adData.target_ages,
            targetGender: adData.target_gender,
          });
        }

        return { success: true, action: "added", message: "Adicionado aos favoritos com dados completos" };
      } catch (error: any) {
        logger.error("[adsRouter] Erro em toggleFavorite", { error: error.message });
        return { success: false, error: error.message };
      }
    }),

  /**
   * Listar favoritos do usuário
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const favorites = await db.query.favoriteAds.findMany({
        where: eq(favoriteAds.userId, ctx.user.id),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
      return { success: true, data: favorites };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }),
});
