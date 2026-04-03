import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { monitoredAds, type InsertMonitoredAd, type MonitoredAd } from "../../drizzle/schema";

/**
 * Serviço de Monitoramento de Anúncios
 * Centraliza toda a lógica de negócio relacionada ao monitoramento
 */

export async function getMonitoredByUserId(userId: number): Promise<MonitoredAd[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(monitoredAds)
    .where(eq(monitoredAds.userId, userId))
    .orderBy(monitoredAds.createdAt);
}

export async function addMonitored(
  userId: number,
  adId: string,
  pageId: string,
  pageName?: string
): Promise<MonitoredAd> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe
  const existing = await db
    .select()
    .from(monitoredAds)
    .where(and(eq(monitoredAds.userId, userId), eq(monitoredAds.adId, adId)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Ad already being monitored");
  }

  await db.insert(monitoredAds).values({
    userId,
    adId,
    pageId,
    pageName,
    monitoringStatus: "active",
    isStillActive: true,
  });

  const result = await db
    .select()
    .from(monitoredAds)
    .where(and(eq(monitoredAds.userId, userId), eq(monitoredAds.adId, adId)))
    .limit(1);

  if (result.length === 0) throw new Error("Failed to create monitored ad");
  return result[0];
}

export async function removeMonitored(userId: number, adId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(monitoredAds)
    .where(and(eq(monitoredAds.userId, userId), eq(monitoredAds.adId, adId)));

  return !!result;
}

export async function updateMonitoringStatus(
  userId: number,
  adId: string,
  status: "active" | "paused" | "completed"
): Promise<MonitoredAd> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(monitoredAds)
    .set({ monitoringStatus: status })
    .where(and(eq(monitoredAds.userId, userId), eq(monitoredAds.adId, adId)));

  const result = await db
    .select()
    .from(monitoredAds)
    .where(and(eq(monitoredAds.userId, userId), eq(monitoredAds.adId, adId)))
    .limit(1);

  if (result.length === 0) throw new Error("Monitored ad not found");
  return result[0];
}

export async function isMonitored(userId: number, adId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(monitoredAds)
    .where(and(eq(monitoredAds.userId, userId), eq(monitoredAds.adId, adId)))
    .limit(1);

  return result.length > 0;
}
