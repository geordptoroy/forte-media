/**
 * Rate Limiting com sliding window
 * Protege a API contra abuso e DDoS
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Limpar entradas expiradas a cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Verificar se a requisição está dentro do limite
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      // Nova janela
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count < maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  /**
   * Obter informações do rate limit
   */
  getInfo(key: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      return {
        remaining: maxRequests,
        resetAt: now + windowMs,
        retryAfter: 0,
      };
    }

    return {
      remaining: Math.max(0, maxRequests - entry.count),
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  /**
   * Resetar limite para uma chave
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Limpar entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.limits.forEach((entry, key) => {
      if (now > entry.resetAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.limits.delete(key));
  }

  /**
   * Destruir o limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Presets de rate limiting comuns
 */
export const RATE_LIMIT_PRESETS = {
  // Endpoints públicos (login, register)
  PUBLIC: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 req / 15 min
  
  // Endpoints autenticados normais
  API: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 req / 15 min
  
  // Endpoints de busca (mais permissivos)
  SEARCH: { maxRequests: 50, windowMs: 1 * 60 * 1000 }, // 50 req / 1 min
  
  // Endpoints de upload (mais restritivos)
  UPLOAD: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req / 1 min
  
  // Endpoints de Meta API (muito restritivos)
  META_API: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 req / 1 min
};
