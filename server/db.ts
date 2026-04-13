import { createPool, Pool } from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users, InsertUser } from "../drizzle/schema";
import * as schema from "../drizzle/schema";
import { logger } from "./_core/logger";

/**
 * Database Connection Layer — Unified & Optimized for Docker
 */

let _pool: Pool | null = null;
let _db: MySql2Database<typeof schema> | null = null;

const POOL_CONFIG = {
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
};

/**
 * Inicializa o pool de conexões e a instância do Drizzle
 */
export async function getDb(): Promise<MySql2Database<typeof schema> | null> {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.error("[Database] DATABASE_URL não definida no ambiente");
    return null;
  }

  try {
    if (!_pool) {
      logger.info("[Database] Inicializando pool de conexões MySQL...");
      _pool = createPool({
        ...POOL_CONFIG,
        uri: databaseUrl,
      });

      // Teste de conectividade
      const connection = await _pool.getConnection();
      await connection.ping();
      connection.release();
      logger.info("[Database] Conexão estabelecida com sucesso");
    }

    _db = drizzle(_pool, { schema, mode: 'default' });
    return _db;
  } catch (error: any) {
    logger.error("[Database] Falha crítica na conexão:", { error: error.message });
    _pool = null;
    _db = null;
    return null;
  }
}

/**
 * Fecha o pool de conexões (útil para desligamento gracioso)
 */
export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    logger.info("[Database] Pool de conexões encerrado");
  }
}

/**
 * Helper: Buscar usuário por email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    logger.error("[Database] Erro em getUserByEmail:", error);
    return undefined;
  }
}

/**
 * Helper: Buscar usuário por ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    logger.error("[Database] Erro em getUserById:", error);
    return undefined;
  }
}

/**
 * Helper: Criar ou atualizar usuário
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  try {
    if (user.id) {
      await db.update(users).set(user).where(eq(users.id, user.id));
    } else {
      await db.insert(users).values(user);
    }
  } catch (error) {
    logger.error("[Database] Erro em upsertUser:", error);
    throw error;
  }
}
