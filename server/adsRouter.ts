import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { favoriteAds } from "../drizzle/schema";

/**
 * Router de Favoritos (Ads)
 * Gerencia os anúncios favoritos do utilizador no banco de dados.
 */
export const adsRouter = router({
  /**
   * Adicionar um anúncio aos favoritos
   */
  addFavorite: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1, "Ad ID is required"),
        pageId: z.string().min(1, "Page ID is required"),
        pageName: z.string().optional(),
        adBody: z.string().optional(),
        adSnapshotUrl: z.string().optional(),
        spend: z.number().optional(),
        impressions: z.number().optional(),
        currency: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

        // Verificar se já existe nos favoritos
        const existing = await db
          .select()
          .from(favoriteAds)
          .where(
            and(
              eq(favoriteAds.userId, ctx.user.id),
              eq(favoriteAds.adId, input.adId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return { success: true, message: "Ad already in favorites", favorite: existing[0] };
        }

        const [inserted] = await db.insert(favoriteAds).values({
          userId: ctx.user.id,
          adId: input.adId,
          pageId: input.pageId,
          pageName: input.pageName,
          adBody: input.adBody,
          adSnapshotUrl: input.adSnapshotUrl,
          spend: input.spend !== undefined ? String(input.spend) : undefined,
          impressions: input.impressions,
          currency: input.currency,
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
   * Remover um anúncio dos favoritos
   */
  removeFavorite: protectedProcedure
    .input(
      z.object({
        favoriteId: z.number().int().positive("Favorite ID must be a positive integer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

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
        console.error("[Ads] removeFavorite error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to remove favorite",
        };
      }
    }),

  /**
   * Listar todos os favoritos do utilizador
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false, error: "Database not available", favorites: [] };
      }

      const favorites = await db
        .select()
        .from(favoriteAds)
        .where(eq(favoriteAds.userId, ctx.user.id))
        .orderBy(favoriteAds.createdAt);

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
});
