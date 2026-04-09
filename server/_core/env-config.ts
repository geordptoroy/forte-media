import { z } from "zod";

/**
 * Schema de validação para variáveis de ambiente
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL válida"),
  PORT: z.coerce.number().default(4000),
  
  // Segurança
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY deve ter pelo menos 32 caracteres"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET deve ter pelo menos 32 caracteres"),
  
  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  
  // Cookies
  COOKIE_SECURE: z.coerce.boolean().default(true),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("strict"),
  COOKIE_HTTP_ONLY: z.coerce.boolean().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  
  // Meta API (opcional)
  META_ACCESS_TOKEN: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  
  // Ngrok (opcional)
  NGROK_AUTHTOKEN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

let config: EnvConfig | null = null;

/**
 * Validar e retornar configurações de ambiente
 */
export function getEnvConfig(): EnvConfig {
  if (config) return config;

  try {
    config = EnvSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
      console.error("Erros de validação de ambiente:");
      errors.forEach(e => console.error(`  - ${e}`));
      throw new Error(`Configuração de ambiente inválida: ${errors.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Verificar se está em produção
 */
export function isProduction(): boolean {
  return getEnvConfig().NODE_ENV === "production";
}

/**
 * Verificar se está em desenvolvimento
 */
export function isDevelopment(): boolean {
  return getEnvConfig().NODE_ENV === "development";
}
