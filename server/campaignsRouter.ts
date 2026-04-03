import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { userCampaigns, campaignMetricsHistory } from "../drizzle/schema";

/**
 * Campaigns Router - Refactored for Meta Marketing API compatibility
 * Handles management of own user campaigns
 */
export const campaignsRouter = router({
  /**
   * List all user campaigns
   */
  getCampaigns: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const campaigns = await db
        .select()
        .from(userCampaigns)
        .where(eq(userCampaigns.userId, ctx.user.id))
        .orderBy(desc(userCampaigns.updatedAt));

      return { success: true, campaigns };
    } catch (error) {
      console.error("[Campaigns] getCampaigns error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get campaigns",
        campaigns: [],
      };
    }
  }),

  /**
   * Create or update a campaign (Upsert)
   */
  upsertCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.string().min(1, "Campaign ID is required"),
        campaignName: z.string().min(1, "Campaign name is required"),
        adAccountId: z.string().min(1, "Ad Account ID is required"),
        status: z.enum(["active", "paused", "completed", "archived"]).optional(),
        objective: z.string().optional(),
        totalSpend: z.number().optional(),
        totalImpressions: z.number().optional(),
        totalClicks: z.number().optional(),
        totalConversions: z.number().optional(),
        totalConversionValue: z.number().optional(),
        roas: z.number().optional(),
        ctr: z.number().optional(),
        cpc: z.number().optional(),
        cpm: z.number().optional(),
        currency: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if exists
        const existing = await db
          .select()
          .from(userCampaigns)
          .where(
            and(
              eq(userCampaigns.userId, ctx.user.id),
              eq(userCampaigns.campaignId, input.campaignId)
            )
          )
          .limit(1);

        const campaignData = {
          campaignName: input.campaignName,
          adAccountId: input.adAccountId,
          status: input.status ?? "active",
          objective: input.objective,
          totalSpend: input.totalSpend !== undefined ? String(input.totalSpend) : "0.00",
          totalImpressions: input.totalImpressions ?? 0,
          totalClicks: input.totalClicks ?? 0,
          totalConversions: input.totalConversions ?? 0,
          totalConversionValue: input.totalConversionValue !== undefined ? String(input.totalConversionValue) : "0.00",
          roas: input.roas !== undefined ? String(input.roas) : undefined,
          ctr: input.ctr !== undefined ? String(input.ctr) : undefined,
          cpc: input.cpc !== undefined ? String(input.cpc) : undefined,
          cpm: input.cpm !== undefined ? String(input.cpm) : undefined,
          currency: input.currency,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        };

        if (existing.length > 0) {
          await db
            .update(userCampaigns)
            .set(campaignData)
            .where(eq(userCampaigns.id, existing[0].id));
          return { success: true, message: "Campaign updated" };
        } else {
          await db.insert(userCampaigns).values({
            userId: ctx.user.id,
            campaignId: input.campaignId,
            ...campaignData,
          });
          return { success: true, message: "Campaign created" };
        }
      } catch (error) {
        console.error("[Campaigns] upsertCampaign error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to upsert campaign",
        };
      }
    }),

  /**
   * Delete a campaign
   */
  deleteCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .delete(userCampaigns)
          .where(
            and(
              eq(userCampaigns.campaignId, input.campaignId),
              eq(userCampaigns.userId, ctx.user.id)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Campaigns] deleteCampaign error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete campaign",
        };
      }
    }),

  /**
   * Get metrics history for a campaign
   */
  getMetricsHistory: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive("Internal ID is required"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify campaign ownership
        const campaign = await db
          .select()
          .from(userCampaigns)
          .where(
            and(
              eq(userCampaigns.id, input.id),
              eq(userCampaigns.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (campaign.length === 0) {
          throw new Error("Campaign not found");
        }

        const history = await db
          .select()
          .from(campaignMetricsHistory)
          .where(eq(campaignMetricsHistory.campaignId, input.id))
          .orderBy(desc(campaignMetricsHistory.recordedAt));

        return { success: true, history };
      } catch (error) {
        console.error("[Campaigns] getMetricsHistory error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get metrics history",
          history: [],
        };
      }
    }),

  /**
   * Record a metrics snapshot for a campaign
   */
  recordMetrics: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        spend: z.number(),
        impressions: z.number().int(),
        clicks: z.number().int(),
        conversions: z.number().int().optional(),
        conversionValue: z.number().optional(),
        roas: z.number().optional(),
        ctr: z.number().optional(),
        cpc: z.number().optional(),
        cpm: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify campaign ownership
        const campaign = await db
          .select()
          .from(userCampaigns)
          .where(
            and(
              eq(userCampaigns.id, input.id),
              eq(userCampaigns.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (campaign.length === 0) {
          throw new Error("Campaign not found");
        }

        await db.insert(campaignMetricsHistory).values({
          campaignId: input.id,
          spend: String(input.spend),
          impressions: input.impressions,
          clicks: input.clicks,
          conversions: input.conversions,
          conversionValue: input.conversionValue !== undefined ? String(input.conversionValue) : undefined,
          roas: input.roas !== undefined ? String(input.roas) : undefined,
          ctr: input.ctr !== undefined ? String(input.ctr) : undefined,
          cpc: input.cpc !== undefined ? String(input.cpc) : undefined,
          cpm: input.cpm !== undefined ? String(input.cpm) : undefined,
        });

        return { success: true };
      } catch (error) {
        console.error("[Campaigns] recordMetrics error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to record metrics",
        };
      }
    }),
});
