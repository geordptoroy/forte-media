import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

/**
 * Tipos de erros da aplicação
 */
export enum ErrorCode {
  // Autenticação
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  
  // Autorização
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  
  // Validação
  INVALID_INPUT = "INVALID_INPUT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  
  // Recursos
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_EXISTS = "RESOURCE_EXISTS",
  
  // Rate Limiting
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  
  // Servidor
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
  
  // Integrações
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  META_API_ERROR = "META_API_ERROR",
}

/**
 * Classe de erro customizada da aplicação
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Converter AppError para TRPCError
 */
export function appErrorToTRPCError(error: AppError): TRPCError {
  const codeMap: Record<ErrorCode, any> = {
    [ErrorCode.UNAUTHORIZED]: "UNAUTHORIZED",
    [ErrorCode.INVALID_CREDENTIALS]: "UNAUTHORIZED",
    [ErrorCode.SESSION_EXPIRED]: "UNAUTHORIZED",
    [ErrorCode.FORBIDDEN]: "FORBIDDEN",
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: "FORBIDDEN",
    [ErrorCode.INVALID_INPUT]: "BAD_REQUEST",
    [ErrorCode.VALIDATION_ERROR]: "BAD_REQUEST",
    [ErrorCode.NOT_FOUND]: "NOT_FOUND",
    [ErrorCode.RESOURCE_EXISTS]: "CONFLICT",
    [ErrorCode.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.SERVICE_UNAVAILABLE]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.TIMEOUT]: "TIMEOUT",
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.META_API_ERROR]: "INTERNAL_SERVER_ERROR",
  };

  return new TRPCError({
    code: codeMap[error.code] || "INTERNAL_SERVER_ERROR",
    message: error.message,
    cause: error.details,
  });
}

/**
 * Tratador centralizado de erros
 */
export function handleError(error: unknown): TRPCError {
  // Se já é um AppError, converter para TRPCError
  if (error instanceof AppError) {
    logger.error(`[AppError] ${error.code}: ${error.message}`, error.details);
    return appErrorToTRPCError(error);
  }

  // Se já é um TRPCError, retornar como está
  if (error instanceof TRPCError) {
    return error;
  }

  // Se é um erro padrão
  if (error instanceof Error) {
    logger.error(`[Error] ${error.name}: ${error.message}`, { stack: error.stack });
    
    // Tentar extrair informações úteis
    if (error.message.includes("ECONNREFUSED")) {
      return new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    if (error.message.includes("timeout")) {
      return new TRPCError({
        code: "TIMEOUT",
        message: "Request timeout",
      });
    }

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    });
  }

  // Erro desconhecido
  logger.error("[Unknown Error]", error);
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}

/**
 * Wrapper para funções async que garante tratamento de erro
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (context) {
      logger.error(`[${context}] Error:`, error);
    }
    throw handleError(error);
  }
}

/**
 * Validar entrada com Zod e lançar AppError se inválido
 */
export function validateInput<T>(
  schema: any,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error: any) {
    const message = error.errors?.[0]?.message || "Invalid input";
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      message,
      400,
      { errors: error.errors }
    );
  }
}
