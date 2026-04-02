import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { monitoredAds } from "../drizzle/schema";

/**
 * Router de Monitoramento
 * Gerencia os anúncios monitorados pelo utilizador no banco de dados.
 */
export const monitoringRouter = router({
  /**
   * Adicionar um anúncio ao monitoramento
   */
  addMonitored: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1, "Ad ID is required"),
        pageId: z.string().min(1, "Page ID is required"),
        pageName: z.string().optional(),
        alertConfig: z.record(z.string(), z.any()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

        // Verificar se já está a ser monitorado
        const existing = await db
          .select()
          .from(monitoredAds)
          .where(
            and(
              eq(monitoredAds.userId, ctx.user.id),
              eq(monitoredAds.adId, input.adId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Se já existe mas está pausado, reativar
          if (existing[0].monitoringStatus !== "active") {
            await db
              .update(monitoredAds)
              .set({ monitoringStatus: "active", updatedAt: new Date() })
              .where(eq(monitoredAds.id, existing[0].id));
            return { success: true, message: "Monitoring reactivated" };
          }
          return { success: true, message: "Ad already being monitored" };
        }

        await db.insert(monitoredAds).values({
          userId: ctx.user.id,
          adId: input.adId,
          pageId: input.pageId,
          pageName: input.pageName,
          monitoringStatus: "active",
          isStillActive: true,
          notes: input.notes,
          spendHistory: [],
        });

        return { success: true, message: "Monitoring started" };
      } catch (error) {
        console.error("[Monitoring] addMonitored error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to add monitoring",
        };
      }
    }),

  /**
   * Remover um anúncio do monitoramento
   */
  removeMonitored: protectedProcedure
    .input(
      z.object({
        monitoredId: z.number().int().positive("Monitored ID must be a positive integer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

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
        console.error("[Monitoring] removeMonitored error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to remove monitoring",
        };
      }
    }),

  /**
   * Listar todos os anúncios monitorados do utilizador
   */
  getMonitored: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false, error: "Database not available", monitored: [] };
      }

      const monitored = await db
        .select()
        .from(monitoredAds)
        .where(eq(monitoredAds.userId, ctx.user.id))
        .orderBy(monitoredAds.createdAt);

      return { success: true, monitored };
    } catch (error) {
      console.error("[Monitoring] getMonitored error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get monitored ads",
        monitored: [],
      };
    }
  }),

  /**
   * Atualizar o status de monitoramento de um anúncio
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        monitoredId: z.number().int().positive(),
        status: z.enum(["active", "paused", "completed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

        await db
          .update(monitoredAds)
          .set({ monitoringStatus: input.status, updatedAt: new Date() })
          .where(
            and(
              eq(monitoredAds.id, input.monitoredId),
              eq(monitoredAds.userId, ctx.user.id)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Monitoring] updateStatus error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update status",
        };
      }
    }),
});
