import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";

let _db: MySql2Database | null = null;
let _pool: ReturnType<typeof createPool> | null = null;

const DEFAULT_POOL_CONFIG = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
};

/**
 * Inicializa o pool de conexões MySQL com configurações otimizadas
 */
async function initializePool() {
  if (_pool) return _pool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não definida");
  }

  try {
    _pool = createPool({
      ...DEFAULT_POOL_CONFIG,
      uri: databaseUrl,
    });

    // Testar conexão
    const connection = await _pool.getConnection();
    await connection.ping();
    connection.release();

    console.log("[DB Pool] Pool de conexões inicializado com sucesso");
    return _pool;
  } catch (error) {
    console.error("[DB Pool] Falha ao inicializar pool:", error);
    _pool = null;
    throw error;
  }
}

/**
 * Retorna a instância do Drizzle com pool de conexões
 */
export async function getDb(): Promise<MySql2Database | null> {
  if (_db) return _db;

  try {
    const pool = await initializePool();
    if (!pool) return null;

    _db = drizzle(pool);
    return _db;
  } catch (error) {
    console.error("[DB] Falha ao obter instância do Drizzle:", error);
    return null;
  }
}

/**
 * Fecha o pool de conexões gracefully
 */
export async function closeDbPool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    console.log("[DB Pool] Pool de conexões fechado");
  }
}

/**
 * Retorna informações do pool para monitoramento
 */
export async function getPoolStats() {
  if (!_pool) return null;

  return {
    connectionLimit: DEFAULT_POOL_CONFIG.connectionLimit,
    queueLimit: DEFAULT_POOL_CONFIG.queueLimit,
  };
}
