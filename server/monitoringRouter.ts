import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { monitoredAds } from "../drizzle/schema";

/**
 * Monitoring Router - Refactored for Meta ads_archive API
 * Handles continuous monitoring of competitive ads
 */
export const monitoringRouter = router({
  /**
   * Add an ad to monitoring
   */
  addMonitored: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1, "Ad ID is required"),
        pageId: z.string().min(1, "Page ID is required"),
        pageName: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if already being monitored
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
          // If exists but paused, reactivate
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
          metricsHistory: [],
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
   * Remove an ad from monitoring
   */
  removeMonitored: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .delete(monitoredAds)
          .where(
            and(
              eq(monitoredAds.adId, input.adId),
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
   * Get all monitored ads for the user
   */
  getMonitored: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

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
   * Update monitoring status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        adId: z.string().min(1),
        status: z.enum(["active", "paused", "completed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(monitoredAds)
          .set({ monitoringStatus: input.status, updatedAt: new Date() })
          .where(
            and(
              eq(monitoredAds.adId, input.adId),
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
