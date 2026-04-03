import { and, eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  userCampaigns,
  campaignMetricsHistory,
  type InsertUserCampaign,
  type UserCampaign,
  type CampaignMetricsHistory,
} from "../../drizzle/schema";

/**
 * Serviço de Campanhas
 * Centraliza toda a lógica de negócio relacionada a campanhas
 */

export async function getCampaignsByUserId(userId: number): Promise<UserCampaign[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(userCampaigns)
    .where(eq(userCampaigns.userId, userId))
    .orderBy(userCampaigns.createdAt);
}

export async function getCampaignById(userId: number, campaignId: number): Promise<UserCampaign | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userCampaigns)
    .where(and(eq(userCampaigns.id, campaignId), eq(userCampaigns.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertCampaign(
  userId: number,
  campaignData: Omit<InsertUserCampaign, "userId">
): Promise<UserCampaign> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(userCampaigns)
    .where(
      and(
        eq(userCampaigns.userId, userId),
        eq(userCampaigns.campaignId, campaignData.campaignId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userCampaigns)
      .set({ ...campaignData, updatedAt: new Date() })
      .where(eq(userCampaigns.id, existing[0].id));

    const updated = await db
      .select()
      .from(userCampaigns)
      .where(eq(userCampaigns.id, existing[0].id))
      .limit(1);

    if (updated.length === 0) throw new Error("Failed to update campaign");
    return updated[0];
  } else {
    await db.insert(userCampaigns).values({
      userId,
      ...campaignData,
    });

    const created = await db
      .select()
      .from(userCampaigns)
      .where(
        and(
          eq(userCampaigns.userId, userId),
          eq(userCampaigns.campaignId, campaignData.campaignId)
        )
      )
      .limit(1);

    if (created.length === 0) throw new Error("Failed to create campaign");
    return created[0];
  }
}

export async function deleteCampaign(userId: number, campaignId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(userCampaigns)
    .where(
      and(
        eq(userCampaigns.userId, userId),
        eq(userCampaigns.campaignId, campaignId)
      )
    );

  return !!result;
}

export async function getMetricsHistory(
  userId: number,
  campaignId: number,
  limit: number = 100
): Promise<CampaignMetricsHistory[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar ownership
  const campaign = await getCampaignById(userId, campaignId);
  if (!campaign) throw new Error("Campaign not found");

  return db
    .select()
    .from(campaignMetricsHistory)
    .where(eq(campaignMetricsHistory.campaignId, campaignId))
    .orderBy(desc(campaignMetricsHistory.recordedAt))
    .limit(limit);
}

export async function recordMetrics(
  userId: number,
  campaignId: number,
  metrics: Omit<typeof campaignMetricsHistory.$inferInsert, "campaignId">
): Promise<CampaignMetricsHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar ownership
  const campaign = await getCampaignById(userId, campaignId);
  if (!campaign) throw new Error("Campaign not found");

  await db.insert(campaignMetricsHistory).values({
    campaignId,
    ...metrics,
  });

  const result = await db
    .select()
    .from(campaignMetricsHistory)
    .where(eq(campaignMetricsHistory.campaignId, campaignId))
    .orderBy(desc(campaignMetricsHistory.recordedAt))
    .limit(1);

  if (result.length === 0) throw new Error("Failed to record metrics");
  return result[0];
}
