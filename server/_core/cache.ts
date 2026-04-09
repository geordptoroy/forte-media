/**
 * Cache em memória com TTL para otimizar queries frequentes
 * Ideal para dados que não mudam frequentemente (usuários, credenciais, etc)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Obter valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.clearTimer(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Armazenar valor no cache com TTL
   */
  set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    // Limpar timer anterior se existir
    this.clearTimer(key);

    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });

    // Agendar limpeza automática
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttlMs);

    this.timers.set(key, timer);
  }

  /**
   * Invalidar entrada do cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.clearTimer(key);
  }

  /**
   * Invalidar múltiplas entradas por padrão
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.invalidate(key);
    });
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Obter estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  private clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
}

export const appCache = new MemoryCache();

/**
 * Decorador para cache automático de funções
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlMs: number = 5 * 60 * 1000
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const cached = appCache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    appCache.set(key, result, ttlMs);
    return result;
  }) as T;
}
