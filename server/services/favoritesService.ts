import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { favoriteAds, type InsertFavoriteAd, type FavoriteAd } from "../../drizzle/schema";

/**
 * Serviço de Anúncios Favoritos
 * Centraliza toda a lógica de negócio relacionada a favoritos
 */

export async function getFavoritesByUserId(userId: number): Promise<FavoriteAd[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(favoriteAds)
    .where(eq(favoriteAds.userId, userId))
    .orderBy(favoriteAds.createdAt);
}

export async function addFavorite(
  userId: number,
  adId: string,
  adData: Partial<InsertFavoriteAd>
): Promise<FavoriteAd> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe
  const existing = await db
    .select()
    .from(favoriteAds)
    .where(and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, adId)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Ad already in favorites");
  }

  await db.insert(favoriteAds).values({
    userId,
    adId,
    ...adData,
  });

  const result = await db
    .select()
    .from(favoriteAds)
    .where(and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, adId)))
    .limit(1);

  if (result.length === 0) throw new Error("Failed to create favorite");
  return result[0];
}

export async function removeFavorite(userId: number, adId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(favoriteAds)
    .where(and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, adId)));

  return !!result;
}

export async function isFavorited(userId: number, adId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(favoriteAds)
    .where(and(eq(favoriteAds.userId, userId), eq(favoriteAds.adId, adId)))
    .limit(1);

  return result.length > 0;
}
